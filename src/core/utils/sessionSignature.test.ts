import { describe, expect, it } from "vitest";
import type { BrowserWindow, Session } from "@/core/types";
import { sessionSignature } from "./sessionSignature";

function sessionWith(...windows: string[][]): Session {
  return {
    title: "Current Session",
    id: "current",
    dateSaved: undefined,
    dateModified: undefined,
    windowsNumber: windows.length,
    tabsNumber: windows.flat().length,
    windows: windows.map(
      (urls) => ({ tabs: urls.map((url) => ({ url })) }) as BrowserWindow,
    ),
  };
}

describe("sessionSignature", () => {
  it("matches two sessions with the same tabs", () => {
    expect(sessionSignature(sessionWith(["https://a.com"]))).toBe(
      sessionSignature(sessionWith(["https://a.com"])),
    );
  });

  it("ignores title and dates", () => {
    const a = sessionWith(["https://a.com"]);
    const b = { ...sessionWith(["https://a.com"]), title: "Other" };

    expect(sessionSignature(a)).toBe(sessionSignature(b));
  });

  it("differs when a tab is added, removed or reordered", () => {
    const base = sessionSignature(sessionWith(["https://a.com"]));

    expect(sessionSignature(sessionWith(["https://a.com", "https://b.com"]))) //
      .not.toBe(base);
    expect(sessionSignature(sessionWith([]))).not.toBe(base);
    expect(
      sessionSignature(sessionWith(["https://b.com", "https://a.com"])),
    ).not.toBe(
      sessionSignature(sessionWith(["https://a.com", "https://b.com"])),
    );
  });

  it("differs when tabs move between windows", () => {
    expect(
      sessionSignature(sessionWith(["https://a.com", "https://b.com"])),
    ).not.toBe(
      sessionSignature(sessionWith(["https://a.com"], ["https://b.com"])),
    );
  });

  it("returns an empty signature for a session with no windows", () => {
    expect(sessionSignature(undefined)).toBe("");
    expect(sessionSignature(sessionWith())).toBe("");
  });
});
