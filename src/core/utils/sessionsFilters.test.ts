import { describe, expect, it } from "vitest";
import type { Session } from "@/core/types";
import { filterTags, filterTagsAndSort, sortSessions } from "./sessionsFilters";

const sessions: Session[] = [
  {
    title: "Beta",
    windows: [],
    windowsNumber: 0,
    tabsNumber: 1,
    dateSaved: 3000,
    dateModified: undefined,
    id: "11111111-1111-4111-8111-111111111111",
    tag: "Work",
  },
  {
    title: "Alpha",
    windows: [],
    windowsNumber: 0,
    tabsNumber: 1,
    dateSaved: 1000,
    dateModified: undefined,
    id: "22222222-2222-4222-8222-222222222222",
    tag: "Personal",
  },
  {
    title: "Gamma",
    windows: [],
    windowsNumber: 0,
    tabsNumber: 1,
    dateSaved: 2000,
    dateModified: undefined,
    id: "33333333-3333-4333-8333-333333333333",
  },
];

describe("sortSessions", () => {
  it("sorts by newest dateSaved", () => {
    expect(sortSessions("newest", [...sessions]).map((s) => s.title)).toEqual([
      "Beta",
      "Gamma",
      "Alpha",
    ]);
  });

  it("sorts by oldest dateSaved", () => {
    expect(sortSessions("oldest", [...sessions]).map((s) => s.title)).toEqual([
      "Alpha",
      "Gamma",
      "Beta",
    ]);
  });

  it("sorts A-Z by title", () => {
    expect(sortSessions("az", [...sessions]).map((s) => s.title)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("sorts Z-A by title", () => {
    expect(sortSessions("za", [...sessions]).map((s) => s.title)).toEqual([
      "Gamma",
      "Beta",
      "Alpha",
    ]);
  });

  it("does not mutate the source order", () => {
    const source = [...sessions];
    sortSessions("az", sessions);
    expect(sessions).toEqual(source);
  });
});

describe("filterTags", () => {
  it("passes through all sessions for __all__", () => {
    expect(filterTags(sessions, "__all__")).toEqual(sessions);
  });

  it("matches sessions by tag", () => {
    expect(filterTags(sessions, "Work").map((s) => s.id)).toEqual([
      "11111111-1111-4111-8111-111111111111",
    ]);
  });

  it("returns empty when no session matches", () => {
    expect(filterTags(sessions, "Missing")).toEqual([]);
  });
});

describe("filterTagsAndSort", () => {
  it("filters then sorts", () => {
    expect(
      filterTagsAndSort(sessions, "za", "Personal").map((s) => s.id),
    ).toEqual(["22222222-2222-4222-8222-222222222222"]);
  });
});
