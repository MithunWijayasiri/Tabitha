import type browser from "webextension-polyfill";

export type BrowserWindow = browser.Windows.Window;
export type BrowserTab = browser.Tabs.Tab;
export type QueryInfo = browser.Tabs.QueryQueryInfoType;
export type CompressOptions = {
  type?: "image/webp" | "image/jpeg" | "image/png";
  quality?: number;
  maxSize?: number;
};
