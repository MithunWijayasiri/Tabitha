import type { Session } from "@/core/types";
import { countSites } from "./sessionSites";

export function generateSession(session: Session): Session {
  const date = Date.now();

  return {
    title: session.title,
    windows: structuredClone(session.windows),
    windowsNumber: session.windows.length,
    tabsNumber: session.tabsNumber,
    dateSaved: date,
    dateModified: date,
    id: crypto.randomUUID(),
    tag: session.tag,
    sites: countSites(session.windows),
  };
}
