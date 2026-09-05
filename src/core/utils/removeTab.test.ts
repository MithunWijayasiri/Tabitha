import { describe, expect, it } from "vitest";
import type { BrowserTab, BrowserWindow, Session } from "@/core/types";
import { removeTab } from "./removeTab";

function makeSession(
  windows: { tabs: BrowserTab[] }[],
  tabsNumber?: number,
): Session {
  const session: Session = {
    title: "Test",
    windows: windows as BrowserWindow[],
    windowsNumber: windows.length,
    tabsNumber: tabsNumber ?? windows.reduce((n, w) => n + w.tabs.length, 0),
    dateSaved: undefined,
    dateModified: undefined,
    id: "11111111-1111-4111-8111-111111111111",
  };

  return session;
}

const tabs = [
  { id: 1, title: "a" },
  { id: 2, title: "b" },
  { id: 3, title: "c" },
] as BrowserTab[];

describe("removeTab", () => {
  it("prunes the window when its last tab is removed", () => {
    const session = makeSession([{ tabs: [tabs[0]!] }]);

    removeTab(session, 0, tabs[0]);

    expect(session.windows).toEqual([]);
    expect(session.tabsNumber).toBe(0);
    expect(session.windowsNumber).toBe(0);
  });

  it("removes a whole window and decrements by its tab count", () => {
    const session = makeSession([
      { tabs: [tabs[0]!] },
      { tabs: [tabs[1]!, tabs[2]!] },
    ]);

    removeTab(session, 1);

    expect(session.windows).toHaveLength(1);
    expect(session.tabsNumber).toBe(1);
    expect(session.windowsNumber).toBe(1);
  });

  it("keeps the window when other tabs remain", () => {
    const session = makeSession([{ tabs: [tabs[0]!, tabs[1]!] }]);

    removeTab(session, 0, tabs[0]);

    expect(session.windows[0]!.tabs).toEqual([tabs[1]]);
    expect(session.windows).toHaveLength(1);
    expect(session.tabsNumber).toBe(1);
    expect(session.windowsNumber).toBe(1);
  });

  it("is a no-op for an unknown tab", () => {
    const session = makeSession([{ tabs: [tabs[0]!] }]);

    removeTab(session, 0, { id: 99, title: "x" } as BrowserTab);

    expect(session.windows[0]!.tabs).toEqual([tabs[0]]);
    expect(session.tabsNumber).toBe(1);
  });
});
