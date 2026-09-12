import type { UUID } from "crypto";
import type {
  Session,
  SessionSummary,
  BrowserTab,
  FilterOptions,
} from "@/core/types";
import { derived, get, writable, type Writable } from "svelte/store";
import { sessionStore, toSummary } from "@utils/database";
import { removeTab } from "@utils/removeTab";
import { settings, notification, filterOptions } from "@/core/state";
import {
  generateSession,
  sendMessage,
  filterTagsAndSort,
  sessionSignature,
  getSession,
  isExtensionViewed,
  log,
  type Message,
} from "@/core/utils";
import { createCurrentSessionReader } from "./currentSession";
import browser from "webextension-polyfill";

export const currentSession: Writable<Session> = writable();

export const sessions = (() => {
  const { subscribe, set, update }: Writable<SessionSummary[]> = writable([]);

  const selection: Writable<Session> = writable();

  const loaded = writable(false);

  // True while a mutation runs; a second call is dropped rather than queued.
  const busy = writable(false);

  async function exclusive<T>(action: () => Promise<T>) {
    if (get(busy)) return;

    busy.set(true);

    try {
      return await action();
    } finally {
      busy.set(false);
    }
  }

  /*
   * The current session is read in every context that loads this store, popup row
   * or not: the palette offers "save current session" everywhere, and a value
   * snapshotted at load time would save the wrong tabs. No component owns it.
   */
  const current = createCurrentSessionReader({
    store: currentSession,

    read: async () => {
      await settings.init(); // the filters come from storage - never from the defaults

      const { excludePinned, urlFilterList } = get(settings);

      return getSession({
        pinned: excludePinned ? false : undefined,
        url: urlFilterList,
      });
    },

    watch: (events) => {
      browser.windows.onFocusChanged.addListener(events.changed);
      browser.tabs.onCreated.addListener(events.changed);
      browser.tabs.onUpdated.addListener(events.changed);
      browser.tabs.onActivated.addListener(events.changed);
      browser.tabs.onMoved.addListener(events.changed);
      browser.tabs.onDetached.addListener(events.changed);
      browser.tabs.onRemoved.addListener(events.removed);

      return () => {
        browser.windows.onFocusChanged.removeListener(events.changed);
        browser.tabs.onCreated.removeListener(events.changed);
        browser.tabs.onUpdated.removeListener(events.changed);
        browser.tabs.onActivated.removeListener(events.changed);
        browser.tabs.onMoved.removeListener(events.changed);
        browser.tabs.onDetached.removeListener(events.changed);
        browser.tabs.onRemoved.removeListener(events.removed);
      };
    },

    visible: isExtensionViewed,

    onVisibilityChange: (handler) =>
      document.addEventListener("visibilitychange", handler),

    selectedId: () => get(settings).selectionId,

    select: (session) => selection.set(session),

    // The live session, never the selection: a saved session may be selected
    // when a window closes, and deleteTab would persist the removal into it.
    removeTab: (windowIndex, tab) => {
      const live = get(currentSession);

      if (!live) return;

      removeTab(live, windowIndex, tab);

      currentSession.set(live);

      if (get(settings).selectionId === "current") selection.set(live);
    },
  });

  load();

  async function load() {
    await sessionStore.iterateSessions("dateSaved", set, 50);

    await settings.init(); // to fix inconsistent behaviour with FF and Chrome - need to check

    const { selectionId } = get(settings);

    await current.ready; // "current" holds no value until the first read lands

    selectById(selectionId);

    loaded.set(true);
  }

  async function add(session: Session) {
    await settings.init(); // lastSaved lives in storage - never compare against a default

    // Optional: a failed current-session read leaves the store undefined.
    if (!session?.windows?.length || !session.tabsNumber) {
      notification.error(
        "Open a tab before saving",
        "This session has no tabs",
      );

      return;
    }

    const isCurrent = session.id === "current";
    const signature = sessionSignature(session);

    if (isCurrent && signature === get(settings).lastSaved.signature) {
      notification.error(
        "Change a tab before saving again",
        "Nothing changed since the last save",
      );

      return;
    }

    const generated = generateSession(session);

    try {
      await sessionStore.saveSession(generated);
    } catch (error) {
      notification.error("Save failed", (error as Error).message);

      return;
    }

    if (isCurrent)
      settings.changeSetting("lastSaved", { id: generated.id, signature });

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

    target.dateModified = Date.now();

    try {
      await sessionStore.updateSession(target);
    } catch (error) {
      notification.error("Update failed", (error as Error).message);

      return;
    }

    update((sessions) => {
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
      return notification.error("Select a session first", "Nothing to delete");

    const index = get({ subscribe }).findIndex(
      (session) => session.id === target.id,
    );

    if (index === -1) {
      notification.error("Select a session first", "Nothing to delete");

      return;
    }

    try {
      await sessionStore.deleteSession(target);
    } catch (error) {
      notification.error("Delete failed", (error as Error).message);

      return;
    }

    if (target.id === get(settings).lastSaved.id)
      settings.changeSetting("lastSaved", { signature: "" });

    // Re-resolved after the await: a dbChanged broadcast can replace the list mid-delete.
    update((sessions) => {
      const remaining = sessions.filter((session) => session.id !== target.id);

      notify(remaining);

      return remaining;
    });

    notification.success_warning("Session deleted");
  }

  async function removeAll() {
    const length = get({ subscribe }).length;

    if (!length) {
      notification.error("Save a session first", "Nothing to delete");
      return;
    }

    try {
      await sessionStore.deleteSessions();
    } catch (error) {
      notification.error("Delete failed", (error as Error).message);

      return;
    }

    settings.changeSetting("lastSaved", { signature: "" });
    settings.changeSetting("lastAutoSaved", "");

    set([]); //Empty the array, no longer needed

    select(get(currentSession));

    notification.success_warning("All sessions deleted");

    notify([]);
  }

  async function select(session: SessionSummary) {
    // Callers fall back to currentSession, which is undefined if its read failed.
    if (!session) return;

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
    add: (session: Session) => exclusive(() => add(session)),
    put,
    filter,
    remove: (target: SessionSummary) => exclusive(() => remove(target)),
    removeAll: () => exclusive(removeAll),
    removeTab: deleteTab,
    busy: { subscribe: busy.subscribe },
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
  let currentSort: FilterOptions["sortMethod"] | undefined;
  let currentTagsFilter: FilterOptions["tagsFilter"] | undefined;
  let filteredList: SessionSummary[] = [];
  let generation = 0;

  const { subscribe } = derived(
    [sessions, filterOptions],
    ([$sessions, $filterOptions], set: (val: SessionSummary[]) => void) => {
      const { query, tagsFilter, sortMethod } = $filterOptions;

      /*
       * The query result is cached because sessions.filter rescans every record in
       * the database. It may only be reused when the query is unchanged and this run
       * was triggered by a sort or tag change - an identical set of options means the
       * run came from sessions instead, so the cache no longer reflects the store.
       */
      const reuseCache =
        query === currentQuery &&
        (sortMethod !== currentSort || tagsFilter !== currentTagsFilter);

      currentQuery = query;
      currentSort = sortMethod;
      currentTagsFilter = tagsFilter;

      if (!query) {
        generation++; // drops any query still in flight

        set(filterTagsAndSort($sessions, sortMethod, tagsFilter));

        return;
      }

      if (reuseCache)
        return set(filterTagsAndSort(filteredList, sortMethod, tagsFilter));

      const request = ++generation;

      sessions.filter(query.trim().toLowerCase()).then(
        (val) => {
          if (request !== generation) return;

          filteredList = val;

          set(filterTagsAndSort(filteredList, sortMethod, tagsFilter));
        },
        () => {
          if (request === generation) set([]);
        },
      );
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

/* True while the current session still matches what was last saved from it -
   the save action stays disabled until a window or tab changes. */
export const currentSessionSaved = derived(
  [currentSession, settings],
  ([$current, $settings]) =>
    !!$settings.lastSaved.signature &&
    sessionSignature($current) === $settings.lastSaved.signature,
);
