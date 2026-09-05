import type {
  Session,
  BrowserTab,
  QueryInfo,
  CompressOptions,
} from "@/core/types";
import browser from "webextension-polyfill";
import { compress as compressLZ } from "lz-string";
import { compressOptions, tabAttr } from "@/core/constants/shared";
import { compress } from "@utils/compress";
import { decodeDiscardedUrl, isDiscardedUrl } from "@/core/utils/discardedUrl";

// Get all tabs of current window
export async function getWindowTabs(
  optionalQuery: QueryInfo = {},
): Promise<BrowserTab[]> {
  return getTabs({ ...optionalQuery, currentWindow: true });
}

export async function getTabs(
  queryInfo: QueryInfo = {},
  options?: CompressOptions,
): Promise<BrowserTab[]> {
  const tabs = await browser?.tabs?.query(queryInfo);

  for (const tab of tabs) {
    if (!tab.url) continue;

    if (isDiscardedUrl(tab.url))
      tab.url = decodeDiscardedUrl(tab.url)?.url ?? tab.url;

    if (tab.favIconUrl) {
      if (compress)
        tab.favIconUrl = await compress.icon(tab.favIconUrl, options);

      tab.favIconUrl = compressLZ(tab.favIconUrl);
    }

    for (const prop in tab) {
      if (!tabAttr.includes(prop)) delete tab[prop as keyof BrowserTab];
    }
  }

  return tabs;
}

export async function getSession(queryInfo?: QueryInfo) {
  const session: Session = {
    title: "Current Session",
    windows: [],
    windowsNumber: 0,
    id: "current",
    dateSaved: undefined,
    dateModified: undefined,
    tabsNumber: 0,
  };

  queryInfo ??= {};

  session.windows = await browser?.windows?.getAll();

  for (const window of session.windows) {
    queryInfo.windowId = window.id;

    window.tabs = await getTabs(queryInfo, compressOptions);

    session.tabsNumber += window.tabs.length;
  }

  session.windowsNumber = session.windows.length;

  return session;
}
