import type { UUID } from "crypto";
import type { Session, SessionSummary, BrowserTab } from "@/core/types";
import { derived, get, writable, type Writable } from "svelte/store";
import { sessionStore, toSummary } from "@utils/database";
import { removeTab } from "@utils/removeTab";
import { settings, notification, filterOptions } from "@/core/state";
import {
  generateSession,
  sendMessage,
  filterTagsAndSort,
  log,
  type Message,
} from "@/core/utils";
import browser from "webextension-polyfill";

export const sessions = (() => {
  const { subscribe, set, update }: Writable<SessionSummary[]> = writable([]);

  const selection: Writable<Session> = writable();

  const loaded = writable(false);

  load();

  async function load() {
    await sessionStore.iterateSessions("dateSaved", set, 50);

    await settings.init(); // to fix inconsistent behaviour with FF and Chrome - need to check

    const { selectionId } = get(settings);

    selectById(selectionId);

    loaded.set(true);
  }

  async function add(session: Session) {
    if (!session.windows.length || !session.tabsNumber)
      return notification.error(
        "Failed to save empty session",
        "Session is empty",
      );

    const generated = generateSession(session);

    try {
      await sessionStore.saveSession(generated);
    } catch (error) {
      notification.error("Failed to save session", (error as Error).message);

      return;
    }

    update((sessions) => {
      sessions.push(toSummary(generated));

      notify(sessions, generated.id);

      return sessions;
    });

    select(generated);

    notification.success("Session saved");

    return generated.id;
  }

  async function put(target: Session) {
    if (!target.windows.length || !target.tabsNumber) return remove(target);

    try {
      await sessionStore.updateSession(target);
    } catch (error) {
      notification.error("Failed to update session", (error as Error).message);

      return;
    }

    update((sessions) => {
      target.dateModified = Date.now();

      const index = sessions.findIndex((session) => session.id === target.id);

      if (index === -1) {
        log.error("put: session not in store", target.id);
        return sessions;
      }

      sessions[index] = toSummary(target);

      notify(sessions, target.id);

      return sessions;
    });

    selectById(target.id);

    notification.success_info("Session updated");
  }

  let timeout: NodeJS.Timeout;

  async function filter(query: string) {
    if (timeout) clearTimeout(timeout);

    const result = await new Promise<SessionSummary[]>((resolve, reject) => {
      timeout = setTimeout(async () => {
        if (!query) return reject(new Error("There is no search query"));

        const sessions = await sessionStore.filterSessions(query);

        if (!sessions.length)
          return reject(new Error("There are no saved sessions"));

        resolve(sessions);
      }, 250);
    });

    return result;
  }

  async function remove(target: SessionSummary) {
    if (!target || !target.id || target.id === "current")
      return notification.error("Nothing to delete", "Select a session first");

    const index = get({ subscribe }).findIndex(
      (session) => session.id === target.id,
    );

    if (index === -1) {
      notification.error("Nothing to delete", "Select a session first");

      return;
    }

    try {
      await sessionStore.deleteSession(target);
    } catch (error) {
      notification.error("Failed to delete session", (error as Error).message);

      return;
    }

    update((sessions) => {
      sessions.splice(index, 1);

      notify(sessions);

      return sessions;
    });

    notification.success_warning("Session deleted");
  }

  async function removeAll() {
    const length = get({ subscribe }).length;

    if (!length) {
      notification.error("Nothing to delete", "Sessions are already empty");
      return;
    }

    try {
      await sessionStore.deleteSessions();
    } catch (error) {
      notification.error("Failed to delete sessions", (error as Error).message);

      return;
    }

    set([]); //Empty the array, no longer needed

    select(get(currentSession));

    notification.success_warning("All sessions deleted");

    notify([]);
  }

  async function select(session: SessionSummary) {
    settings.changeSetting("selectionId", session.id);

    await selectById(session.id);

    notify(get({ subscribe }), session.id);
  }

  async function deleteTab(windowIndex: number, tab?: BrowserTab) {
    const target = get(selection);

    if (!target) return;

    removeTab(target, windowIndex, tab);

    if (target.id === "current") {
      currentSession.set(target);

      if (get(settings).selectionId === "current") selection.set(target);

      return;
    }

    selection.set(target);

    await put(target);

    if (!target.windows.length || !target.tabsNumber)
      await select(get(currentSession));
  }

  // Without a call to changeSetting - this is used in certain area where we do not need to save storage.
  async function selectById(selectionId: "current" | UUID) {
    if (selectionId === "current") return selection.set(get(currentSession));

    const summary = get({ subscribe }).find(
      (session) => session.id === selectionId,
    );

    if (summary) {
      selection.set(await sessionStore.hydrate(summary));
      return;
    }

    return select(get(currentSession));
  }

  function notify(sessions: SessionSummary[], selectedId?: UUID | "current") {
    sendMessage({ message: "dbChanged", sessions, selectedId });
  }

  browser.runtime.onMessage.addListener((request: unknown) => {
    const message = request as Message;

    if (message.message === "dbChanged") {
      set(message.sessions);

      if (!message.selectedId) return;

      selectById(message.selectedId);
    }
  });

  return {
    subscribe,
    load,
    add,
    put,
    filter,
    remove,
    removeAll,
    removeTab: deleteTab,
    loaded: { subscribe: loaded.subscribe },
    selection: {
      subscribe: selection.subscribe,
      select,
      selectById,
      update: selection.update,
    },
  };
})();

export const filtered = (() => {
  let currentQuery = "";
  let filteredList: SessionSummary[] = [];

  const { subscribe } = derived(
    [sessions, filterOptions],
    ([$sessions, $filterOptions], set: (val: SessionSummary[]) => void) => {
      const { query, tagsFilter, sortMethod } = $filterOptions;

      if (!query) {
        set(filterTagsAndSort($sessions, sortMethod, tagsFilter));
      } else if (currentQuery !== query) {
        currentQuery = query;

        sessions.filter(query.trim().toLowerCase()).then(
          (val) => {
            filteredList = val;

            set(filterTagsAndSort(filteredList, sortMethod, tagsFilter));
          },
          () => set([]),
        );
      } else set(filterTagsAndSort(filteredList, sortMethod, tagsFilter));
    },
  );

  return { subscribe };
})();

export const tags = derived(sessions, ($sessions) => {
  const tagsList: Record<string, number> = {};

  for (const session of $sessions) {
    if (session.tag) {
      tagsList[session.tag] = (tagsList[session.tag] ?? 0) + 1;
    }
  }

  return tagsList;
});

export const currentSession: Writable<Session> = writable();
