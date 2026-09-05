import type { SortMethod, SessionSummary } from "@/core/types";

export function sortSessions(
  sortMethod: SortMethod,
  sessions: SessionSummary[],
) {
  const sorted = [...sessions];

  switch (sortMethod) {
    case "newest": {
      return sorted.sort((a, b) => b.dateSaved! - a.dateSaved!);
    }

    case "oldest": {
      return sorted.sort((a, b) => a.dateSaved! - b.dateSaved!);
    }

    case "az": {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    case "za": {
      return sorted.sort((a, b) => -a.title.localeCompare(b.title));
    }

    case "mostTabs": {
      return sorted.sort((a, b) => b.tabsNumber - a.tabsNumber);
    }
  }
}

export function filterTags(
  sessions: SessionSummary[],
  tag: "__all__" | string,
) {
  if (tag === "__all__") return sessions;

  return sessions.filter((session) => session.tag === tag);
}

export function filterTagsAndSort(
  sessions: SessionSummary[],
  sortMethod: SortMethod,
  tagsFilter: string,
) {
  return sortSessions(sortMethod, filterTags(sessions, tagsFilter));
}
