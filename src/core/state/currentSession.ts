import { get, type Writable } from "svelte/store";
import type { UUID } from "crypto";
import type { BrowserTab, Session } from "@/core/types";

/** Quiet window between a browser event and the read that follows it. */
const DEBOUNCE_MS = 50;

export interface TabRemovedInfo {
  windowId: number;
  isWindowClosing: boolean;
}

export interface CurrentSessionEvents {
  /** Any change to the open windows or tabs. */
  changed: () => void;
  /** A single tab closed; `isWindowClosing` means its window went with it. */
  removed: (tabId: number, info: TabRemovedInfo) => void;
}

export interface CurrentSessionPorts {
  /** Store the reader keeps in sync. */
  store: Writable<Session>;
  /** Reads the live windows and tabs. Injected so the reader is testable. */
  read: () => Promise<Session>;
  /** Starts the browser listeners; returns their detach function. */
  watch: (events: CurrentSessionEvents) => () => void;
  /** Whether the extension view is on screen; listeners stay off while it is not. */
  visible: () => boolean;
  /** Subscribes to visibility changes. */
  onVisibilityChange: (handler: () => void) => void;
  /** The persisted selection id. */
  selectedId: () => UUID | "current";
  /** Re-selects the freshly read session when "current" is the selection. */
  select: (session: Session) => void;
  /** Drops a tab from the live selection. */
  removeTab: (windowIndex: number, tab?: BrowserTab) => void;
}

export interface CurrentSessionReader {
  /** Settles once the first read has finished, whatever its outcome. */
  ready: Promise<void>;
}

/**
 * Owns the listeners that keep the current session up to date.
 *
 * Reads happen only while the view is on screen, and a burst of tab events
 * coalesces into one read. Every browser effect arrives through `ports` - the
 * reader holds no browser API of its own, so it runs outside an extension
 * context and never depends on a component being mounted.
 */
export function createCurrentSessionReader(
  ports: CurrentSessionPorts,
): CurrentSessionReader {
  let timeout: NodeJS.Timeout | undefined;
  let detach: (() => void) | undefined;
  let settled = false;
  let resolveReady!: () => void;

  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  async function read() {
    try {
      const session = await ports.read();

      ports.store.set(session);

      if (ports.selectedId() === "current") ports.select(session);
    } catch (error) {
      // console, not log: log reaches the constants module, which needs the browser API.
      console.error("current session read failed:", error);
    } finally {
      if (!settled) {
        settled = true;

        resolveReady();
      }
    }
  }

  function schedule() {
    clearTimeout(timeout);

    timeout = setTimeout(read, DEBOUNCE_MS);
  }

  function handleRemoval(tabId: number, info: TabRemovedInfo) {
    const session = get(ports.store);

    if (!session) return;

    const windowIndex = session.windows.findIndex(
      (window) => window.id === info.windowId,
    );

    if (windowIndex === -1) return;

    if (info.isWindowClosing) return ports.removeTab(windowIndex);

    const tab = session.windows[windowIndex]?.tabs?.find(
      (candidate) => candidate.id === tabId,
    );

    if (!tab) return;

    ports.removeTab(windowIndex, tab);
  }

  function syncVisibility() {
    if (!ports.visible()) {
      detach?.();
      detach = undefined;

      return;
    }

    detach ??= ports.watch({ changed: schedule, removed: handleRemoval });

    schedule(); // whatever changed while hidden was never seen
  }

  ports.onVisibilityChange(syncVisibility);

  syncVisibility();

  // A hidden view still resolves "current" once - load() waits on ready for it.
  if (!ports.visible()) read();

  return { ready };
}
