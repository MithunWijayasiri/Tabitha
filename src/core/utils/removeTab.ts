import type { BrowserTab, Session } from "@/core/types";

export function removeTab(
  session: Session,
  windowIndex: number,
  tab?: BrowserTab,
): Session {
  const window = session.windows[windowIndex];
  if (!window?.tabs?.length) return session;

  if (tab) {
    const tabIndex = window.tabs.indexOf(tab);
    if (tabIndex === -1) return session;
    window.tabs.splice(tabIndex, 1);
    session.tabsNumber--;
  } else session.tabsNumber -= window.tabs.length;

  if (!tab || !window.tabs.length) session.windows.splice(windowIndex, 1);

  return session;
}
