import { describe, expect, it, vi } from "vitest";
import type { BrowserTab, BrowserWindow, Session } from "@/core/types";
import { createSaveSession, type SaveSessionPorts } from "./saveSession";
import { sessionSignature } from "./sessionSignature";

vi.mock("webextension-polyfill", () => {
  const local = {
    get: vi.fn(async () => ({})),
    set: vi.fn(async () => {}),
    onChanged: { addListener: vi.fn() },
  };

  const browser = {
    windows: { getAll: vi.fn(async () => []) },
    tabs: { query: vi.fn(async () => []) },
    runtime: {
      sendMessage: vi.fn(async () => {}),
      getURL: (path: string) => `chrome-extension://test/${path}`,
    },
    storage: { local },
  };

  return { default: browser, storage: browser.storage };
});

function liveSession(urls: string[] = ["https://a.test"]): Session {
  return {
    title: "Current Session",
    id: "current",
    dateSaved: undefined,
    dateModified: undefined,
    windowsNumber: 1,
    tabsNumber: urls.length,
    windows: [
      {
        id: 1,
        tabs: urls.map((url, index) => ({ id: index, url })),
      } as BrowserWindow,
    ],
  };
}

function makePorts(
  overrides: Partial<SaveSessionPorts> = {},
): SaveSessionPorts {
  return {
    getStorage: vi.fn(async () => ({
      excludePinned: false,
      urlFilterList: undefined,
      lastSaved: { signature: "" },
      lastAutoSaved: "",
    })),
    setStorage: vi.fn(async () => {}),
    getSession: vi.fn(async () => liveSession()),
    getTabs: vi.fn(async () => []),
    persist: vi.fn(async () => {}),
    notify: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("saveSession", () => {
  it("writes once when autosave runs twice with no tab change", async () => {
    let lastAutoSaved = "";

    const ports = makePorts({
      getStorage: vi.fn(async () => ({
        excludePinned: false,
        urlFilterList: undefined,
        lastSaved: { signature: "" },
        lastAutoSaved,
      })),
      setStorage: vi.fn(async (items) => {
        if ("lastAutoSaved" in items)
          lastAutoSaved = items.lastAutoSaved as string;
      }),
    });

    const saveSession = createSaveSession(ports);

    const first = await saveSession({ source: "autosave", title: "Autosave" });
    const second = await saveSession({
      source: "autosave",
      title: "Autosave",
    });

    expect(first.status).toBe("saved");
    expect(second.status).toBe("unchanged");
    expect(ports.persist).toHaveBeenCalledTimes(1);
  });

  it("notifies after every source's successful save", async () => {
    for (const source of [
      "autosave",
      "context-menu",
      "popup",
      "save-window",
    ] as const) {
      const ports = makePorts({
        getTabs: vi.fn(
          async () => [{ id: 1, url: "https://a.test" }] as BrowserTab[],
        ),
      });
      const saveSession = createSaveSession(ports);

      const window = { id: 1 } as BrowserWindow;

      const result = await saveSession({
        source,
        title: "Title",
        window: source === "save-window" ? window : undefined,
      });

      expect(result.status).toBe("saved");
      expect(ports.notify).toHaveBeenCalledTimes(1);
    }
  });

  it("fills id and dateSaved for a window-scoped save", async () => {
    const ports = makePorts({
      getTabs: vi.fn(
        async () => [{ id: 1, url: "https://a.test" }] as BrowserTab[],
      ),
    });

    const saveSession = createSaveSession(ports);

    const window = { id: 1 } as BrowserWindow;

    const result = await saveSession({
      source: "save-window",
      title: "My window",
      window,
    });

    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;

    expect(result.session.id).not.toBe("current");
    expect(result.session.dateSaved).toEqual(expect.any(Number));
    expect(result.session.title).toBe("My window");
    expect(result.session.windowsNumber).toBe(1);
  });

  it("skips an empty session without persisting", async () => {
    const ports = makePorts({ getSession: vi.fn(async () => liveSession([])) });
    const saveSession = createSaveSession(ports);

    const result = await saveSession({ source: "popup", title: "Title" });

    expect(result.status).toBe("empty");
    expect(ports.persist).not.toHaveBeenCalled();
    expect(ports.notify).not.toHaveBeenCalled();
  });

  it("shares the lastSaved guard between popup and context-menu saves", async () => {
    let lastSaved = { signature: "" };

    const ports = makePorts({
      getStorage: vi.fn(async () => ({
        excludePinned: false,
        urlFilterList: undefined,
        lastSaved,
        lastAutoSaved: "",
      })),
      setStorage: vi.fn(async (items) => {
        if ("lastSaved" in items)
          lastSaved = items.lastSaved as typeof lastSaved;
      }),
    });

    const saveSession = createSaveSession(ports);

    const first = await saveSession({ source: "popup", title: "Title" });
    const second = await saveSession({
      source: "context-menu",
      title: "Title",
    });

    expect(first.status).toBe("saved");
    expect(second.status).toBe("unchanged");
  });

  // The other context is background; only a guard read taken after the tab read sees it.
  it("sees a guard written by another context while the tabs were read", async () => {
    let lastSaved = { signature: "" };

    const ports = makePorts({
      getStorage: vi.fn(async () => ({
        excludePinned: false,
        urlFilterList: undefined,
        lastSaved,
        lastAutoSaved: "",
      })),
      getSession: vi.fn(async () => {
        const session = liveSession();

        lastSaved = { signature: sessionSignature(session) };

        return session;
      }),
    });

    const result = await createSaveSession(ports)({
      source: "popup",
      title: "Title",
    });

    expect(result.status).toBe("unchanged");
    expect(ports.persist).not.toHaveBeenCalled();
  });
});
