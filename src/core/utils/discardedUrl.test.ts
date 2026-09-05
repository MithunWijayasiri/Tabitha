import { describe, expect, it, vi } from "vitest";
import { decodeDiscardedUrl, encodeDiscardedUrl } from "./discardedUrl";

vi.mock("webextension-polyfill", () => ({
  default: {
    runtime: {
      getURL: (path: string) => `chrome-extension://test/${path}`,
    },
  },
}));

describe("discardedUrl", () => {
  it("round-trips", () => {
    const params = {
      url: "https://a.test/x?y=1",
      title: "A & B",
      icon: "data:,",
    };
    expect(decodeDiscardedUrl(encodeDiscardedUrl(params))).toEqual(params);
  });

  it("returns undefined without url", () => {
    expect(
      decodeDiscardedUrl("chrome-extension://test/src/discarded/index.html"),
    ).toBeUndefined();
  });
});
