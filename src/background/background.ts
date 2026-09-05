import browser from "webextension-polyfill";
import { createTab, openInNewWindow, openSession } from "./utils/browser";
import { getSession, getWindowTabs } from "@/core/utils/getSession";
import { sessionStore } from "@/core/utils/database";
import { generateSession } from "@/core/utils/generateSession";
import { getStorage, setStorage } from "@/core/utils/storage";
import { log } from "@/core/utils/log";
import { autoSaveDefaults } from "@/core/constants/shared";
import type { Session, Settings } from "@/core/types";
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

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tabitha-autosave") {
    try {
      const session = await getSession();
      session.title = "Autosave";
      session.tag = "Autosave";

      await sessionStore.saveSession(generateSession(session));
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
      await sessionStore.deleteLastAutosavedSession(count - autoSaveMaxSessions);

    await sessionStore.iterateSessions("dateSaved", (sessions) => {
      sendMessage({ message: "dbChanged", sessions, selectedId: selectionId });
    });
  }
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

browser.contextMenus.onClicked.addListener(async ({ menuItemId }) => {
  const { excludePinned, urlFilterList: url } = await getStorage({
    excludePinned: true,
    urlFilterList: undefined,
  } as Settings);

  const pinned = excludePinned ? false : undefined;
  const title = "Unnamed session";

  switch (menuItemId) {
    case "tabitha-save":
      {
        const session = await getSession({
          pinned,
          url,
        });

        if (!session.tabsNumber) return;

        session.title = title;

        try {
          await sessionStore.saveSession(generateSession(session));
        } catch (error) {
          log.error("context save failed:", error);
        }
      }
      break;
    case "tabitha-save-window":
      {
        const window = await browser.windows.getCurrent({ populate: false });
        window.tabs = await getWindowTabs({ pinned, url });

        if (!window.tabs?.length) return;

        const session = {
          title,
          windows: [window],
          windowsNumber: 1,
          tabsNumber: window.tabs.length,
        } as Session;

        try {
          await sessionStore.saveSession(generateSession(session));
        } catch (error) {
          log.error("context save failed:", error);
        }
      }
      break;
  }
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
