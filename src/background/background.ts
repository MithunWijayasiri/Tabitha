import browser from "webextension-polyfill";
import { createTab, openInNewWindow, openSession } from "./utils/browser";
import { sessionStore } from "@/core/utils/database";
import { getStorage, setStorage } from "@/core/utils/storage";
import { log } from "@/core/utils/log";
import { formatTimestamp } from "@/core/utils/formatTimestamp";
import { saveSession } from "@/core/utils/saveSession";
import { createSerializer } from "@/core/utils/serialize";
import { autoSaveDefaults } from "@/core/constants/shared";
import type { Settings } from "@/core/types";
import { sendMessage, type Message } from "@/core/utils/messages";

async function createTimer() {
  const [settings, alarm] = await Promise.all([
    getStorage(autoSaveDefaults as Settings),
    browser.alarms.get("tabitha-autosave"),
  ]);

  if (
    settings.autoSave &&
    (typeof alarm === "undefined" ||
      alarm.periodInMinutes !== settings.autoSaveTimer)
  )
    browser.alarms.create("tabitha-autosave", {
      periodInMinutes: settings.autoSaveTimer,
    });
}

createTimer();

// Autosave and context-menu saves both read a save guard, then write it back.
const serialize = createSerializer();

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "tabitha-autosave") return;

  serialize(async () => {
    try {
      await saveSession({
        source: "autosave",
        title: "Autosave",
        tag: "Autosave",
      });
    } catch (error) {
      log.error("autosave failed:", error);
    }

    const [count, { autoSaveMaxSessions, selectionId }] = await Promise.all([
      sessionStore.getAutosavedCount(),
      getStorage({
        autoSaveMaxSessions: autoSaveDefaults.autoSaveMaxSessions,
        selectionId: "current",
      } as Settings),
    ]);

    if (count > autoSaveMaxSessions)
      await sessionStore.deleteLastAutosavedSession(
        count - autoSaveMaxSessions,
      );

    await sessionStore.iterateSessions("dateSaved", (sessions) => {
      sendMessage({ message: "dbChanged", sessions, selectedId: selectionId });
    });
  });
});

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") setStorage({ updated: true });

  const contexts: browser.Menus.ContextType[] = ["page", "action"];

  browser.contextMenus.create({
    id: "tabitha-save",
    title: "Save session",
    contexts,
  });
  browser.contextMenus.create({
    id: "tabitha-save-window",
    title: "Save window",
    contexts,
  });
});

browser.contextMenus.onClicked.addListener(({ menuItemId }, tab) => {
  serialize(async () => {
    const title = formatTimestamp(Date.now());

    switch (menuItemId) {
      case "tabitha-save":
        try {
          await saveSession({ source: "context-menu", title });
        } catch (error) {
          log.error("context save failed:", error);
        }
        break;
      case "tabitha-save-window":
        {
          /*
           * Taken from the clicked tab where possible: window focus can move while the
           * storage read settles, and getCurrent() would then resolve the wrong window.
           */
          const window =
            tab?.windowId === undefined
              ? await browser.windows.getCurrent({ populate: false })
              : await browser.windows.get(tab.windowId);

          try {
            await saveSession({ source: "save-window", title, window });
          } catch (error) {
            log.error("context save failed:", error);
          }
        }
        break;
    }
  });
});

browser.runtime.onMessage.addListener((request: unknown) => {
  const message = request as Message;

  switch (message.message) {
    case "openWindow": {
      openInNewWindow(message.window, message.discarded);
      break;
    }

    case "openTab": {
      createTab(message.tab, undefined, message.discarded);
      break;
    }

    case "restoreSession": {
      openSession(message.session, true, message.discarded);
      break;
    }

    case "scheduleAutoSave": {
      createTimer();
      break;
    }
  }
});
