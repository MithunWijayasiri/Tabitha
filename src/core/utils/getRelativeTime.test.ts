import { describe, expect, it } from "vitest";
import { getRelativeTime } from "./getRelativeTime";

const MINUTE = 60000;
const HOUR = 3600000;
const DAY = 86400000;
const MONTH = 2628000000;
const YEAR = 31536000000;

describe("getRelativeTime", () => {
  it("returns just now for less than a minute", () => {
    expect(getRelativeTime(Date.now() - 30_000)).toBe("just now");
  });

  it("returns minutes", () => {
    expect(getRelativeTime(Date.now() - 1.5 * MINUTE)).toBe("2 min");
  });

  it("returns hours", () => {
    expect(getRelativeTime(Date.now() - 2 * HOUR)).toBe("2 hr");
  });

  it("returns days", () => {
    expect(getRelativeTime(Date.now() - 3 * DAY)).toBe("3 day");
  });

  it("returns months", () => {
    expect(getRelativeTime(Date.now() - 2 * MONTH)).toBe("2 mo");
  });

  it("returns years", () => {
    expect(getRelativeTime(Date.now() - 2 * YEAR)).toBe("2 yr");
  });
});
