import { describe, expect, it } from "vitest";
import type { BrowserWindow } from "@/core/types";
import { countSites, siteLabel } from "./sessionSites";

function windowWith(...urls: string[]) {
  return { tabs: urls.map((url) => ({ url })) } as BrowserWindow;
}

describe("countSites", () => {
  it("counts domains across every window, most frequent first", () => {
    const sites = countSites([
      windowWith("https://github.com/a", "https://github.com/b"),
      windowWith("https://stackoverflow.com/q", "https://github.com/c"),
    ]);

    expect(sites).toEqual([
      { domain: "github.com", count: 3 },
      { domain: "stackoverflow.com", count: 1 },
    ]);
  });

  it("keeps only the top three", () => {
    const sites = countSites([
      windowWith(
        "https://a.com",
        "https://b.com",
        "https://c.com",
        "https://d.com",
      ),
    ]);

    expect(sites).toHaveLength(3);
  });

  it("skips tabs with no resolvable url", () => {
    expect(countSites([windowWith("", "not a url")])).toEqual([]);
  });

  it("tolerates a window with no tabs", () => {
    expect(countSites([{} as BrowserWindow])).toEqual([]);
  });
});

describe("siteLabel", () => {
  it("drops the suffix on plain two-label hosts", () => {
    expect(siteLabel("github.com")).toBe("github");
  });

  it("leaves deeper hosts whole", () => {
    expect(siteLabel("docs.google.com")).toBe("docs.google.com");
    expect(siteLabel("bbc.co.uk")).toBe("bbc.co.uk");
  });
});
