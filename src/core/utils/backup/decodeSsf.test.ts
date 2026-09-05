import { describe, expect, it } from "vitest";
import { compressToUint8Array } from "lz-string";
import { decodeSsf, BACKUP_MAGIC } from "./decodeSsf";

const sessions = [
  {
    title: "Test session",
    windows: [{ id: 1, tabs: [{ id: 10, title: "Tab", url: "https://a.b" }] }],
    tabsNumber: 1,
    dateSaved: 1234,
    dateModified: 1234,
    id: "cda86272-8ac1-4185-a8b9-0b3b5ccf3cf7",
  },
];

describe("decodeSsf", () => {
  it("decodes compressed data with magic prefix", () => {
    const compressed = compressToUint8Array(
      JSON.stringify(sessions),
    ) as Uint8Array;
    const data = new Uint8Array(BACKUP_MAGIC.length + compressed.length);

    data.set(new TextEncoder().encode(BACKUP_MAGIC));
    data.set(compressed, BACKUP_MAGIC.length);

    expect(decodeSsf(data)).toEqual(sessions);
  });

  it("decodes plain envelope", () => {
    const data = new TextEncoder().encode(
      JSON.stringify({ tabitha: 1, sessions }),
    );

    expect(decodeSsf(data)).toEqual(sessions);
  });

  it("rejects unknown format", () => {
    const data = new TextEncoder().encode(JSON.stringify({ sessions }));

    expect(decodeSsf(data)).toBeNull();
  });
});
