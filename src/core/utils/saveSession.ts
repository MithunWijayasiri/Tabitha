import type { Session, Settings, BrowserWindow } from "@/core/types";
import { getSession, getTabs } from "@/core/utils/getSession";
import { sessionStore } from "@/core/utils/database";
import { generateSession } from "@/core/utils/generateSession";
import { getStorage, setStorage } from "@/core/utils/storage";
import { sessionSignature } from "@/core/utils/sessionSignature";
import { sendMessage } from "@/core/utils/messages";
import { log } from "@/core/utils/log";
import { compressOptions } from "@/core/constants/shared";

export type SaveSource = "autosave" | "context-menu" | "popup" | "save-window";

export interface SaveSessionInput {
  source: SaveSource;
  title: string;
  tag?: string;
  /* Present only for a window-scoped save: skips getSession and its all-windows read. */
  window?: BrowserWindow;
}

export type SaveSessionResult =
  | { status: "saved"; session: Session }
  | { status: "empty" }
  | { status: "unchanged" };

type SaveSessionSettings = Pick<
  Settings,
  "excludePinned" | "urlFilterList" | "lastSaved" | "lastAutoSaved"
>;

export interface SaveSessionPorts {
  getStorage: (keys: SaveSessionSettings) => Promise<SaveSessionSettings>;
  setStorage: (items: Partial<Settings>) => Promise<void>;
  getSession: typeof getSession;
  getTabs: typeof getTabs;
  persist: (session: Session) => Promise<unknown>;
  notify: () => Promise<void>;
}

/*
 * "current session" saves that share the popup's duplicate check are keyed to
 * lastSaved; autosave is kept apart so a background snapshot never disables the
 * Save button; save-window has no duplicate guard.
 */
const guardKeys: Partial<Record<SaveSource, "lastSaved" | "lastAutoSaved">> = {
  autosave: "lastAutoSaved",
  "context-menu": "lastSaved",
  popup: "lastSaved",
};

const storageDefaults: SaveSessionSettings = {
  excludePinned: true,
  urlFilterList: undefined,
  lastSaved: { signature: "" },
  lastAutoSaved: "",
};

async function sessionFromWindow(
  ports: Pick<SaveSessionPorts, "getTabs">,
  window: BrowserWindow,
  queryInfo: { pinned?: boolean; url?: Settings["urlFilterList"] },
): Promise<Session> {
  window.tabs = await ports.getTabs(
    { ...queryInfo, windowId: window.id },
    compressOptions,
  );

  return {
    title: "",
    id: "current",
    dateSaved: undefined,
    dateModified: undefined,
    windows: [window],
    windowsNumber: 1,
    tabsNumber: window.tabs?.length ?? 0,
  };
}

export function createSaveSession(ports: SaveSessionPorts) {
  return async function saveSession({
    source,
    title,
    tag,
    window,
  }: SaveSessionInput): Promise<SaveSessionResult> {
    const { excludePinned, urlFilterList: url } =
      await ports.getStorage(storageDefaults);

    const pinned = excludePinned ? false : undefined;

    const session = window
      ? await sessionFromWindow(ports, window, { pinned, url })
      : await ports.getSession({ pinned, url });

    if (!session.tabsNumber) return { status: "empty" };

    const signature = sessionSignature(session);
    const guardKey = guardKeys[source];

    if (guardKey) {
      /* Read last, not with the filters: background and popup saves share lastSaved
         across contexts, and reading the tabs takes long enough for one to overtake. */
      const guard = await ports.getStorage(storageDefaults);

      const previousSignature =
        guardKey === "lastAutoSaved"
          ? guard.lastAutoSaved
          : guard.lastSaved.signature;

      if (signature === previousSignature) {
        log.warn(`${source} save skipped: nothing changed since the last save`);

        return { status: "unchanged" };
      }
    }

    session.title = title;
    if (tag) session.tag = tag;

    const generated = generateSession(session);

    await ports.persist(generated);

    if (guardKey === "lastAutoSaved")
      await ports.setStorage({ lastAutoSaved: signature });
    else if (guardKey === "lastSaved")
      await ports.setStorage({ lastSaved: { id: generated.id, signature } });

    await ports.notify();

    return { status: "saved", session: generated };
  };
}

async function notifyAll() {
  const { selectionId } = await getStorage({
    selectionId: "current",
  } as Settings);

  await sessionStore.iterateSessions("dateSaved", (sessions) => {
    sendMessage({ message: "dbChanged", sessions, selectedId: selectionId });
  });
}

export const saveSession = createSaveSession({
  getStorage,
  setStorage,
  getSession,
  getTabs,
  persist: (session) => sessionStore.saveSession(session),
  notify: notifyAll,
});
