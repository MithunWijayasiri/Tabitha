import { describe, expect, it } from "vitest";
import type { BrowserWindow, Session } from "@/core/types";
import { generateSession } from "./generateSession";

const session: Session = {
  title: "Test session",
  windows: [{ id: 1 } as BrowserWindow],
  windowsNumber: 1,
  tabsNumber: 1,
  dateSaved: undefined,
  dateModified: undefined,
  id: "current",
  tag: "Personal",
};

describe("generateSession", () => {
  it("assigns a new UUID", () => {
    const generated = generateSession(session);

    expect(generated.id).not.toBe("current");
    expect(generated.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("stamps dateSaved and dateModified", () => {
    const before = Date.now();
    const generated = generateSession(session);
    const after = Date.now();

    expect(generated.dateSaved).toBeGreaterThanOrEqual(before);
    expect(generated.dateSaved).toBeLessThanOrEqual(after);
    expect(generated.dateModified).toBe(generated.dateSaved);
  });

  it("preserves title and tag", () => {
    const generated = generateSession(session);

    expect(generated.title).toBe("Test session");
    expect(generated.tag).toBe("Personal");
    expect(generated.tabsNumber).toBe(1);
  });

  it("deep-clones windows", () => {
    const generated = generateSession(session);

    expect(generated.windows).toEqual(session.windows);
    expect(generated.windows).not.toBe(session.windows);
  });
});
