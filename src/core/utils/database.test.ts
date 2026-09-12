import { describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/types";
import { sessionStore } from "./database";

vi.mock("webextension-polyfill", () => {
  const local = {
    get: vi.fn(async () => ({})),
    set: vi.fn(async () => {}),
    onChanged: { addListener: vi.fn() },
  };

  const browser = {
    runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
    storage: { local },
  };

  return { default: browser, storage: browser.storage };
});

const upgradeSessions = sessionStore.upgradeSessions as (
  db: unknown,
  oldVersion: number,
  newVersion: number,
  transaction: unknown,
) => Promise<void>;

function fakeCursor(records: Session[]) {
  function at(index: number): unknown {
    if (index >= records.length) return undefined;

    return {
      value: records[index],
      update: vi.fn(),
      continue: async () => at(index + 1),
    };
  }

  return { openCursor: async () => at(0) };
}

describe("upgradeSessions", () => {
  it("backfills sites for records saved before v3", async () => {
    const session = {
      windows: [{ id: 1, tabs: [{ id: 1, url: "https://a.test" }] }],
    } as unknown as Session;

    const store = fakeCursor([session]);
    const transaction = { objectStore: vi.fn(() => store) };

    await upgradeSessions({}, 2, 3, transaction);

    expect(session.sites).toEqual([{ domain: "a.test", count: 1 }]);
  });
});
