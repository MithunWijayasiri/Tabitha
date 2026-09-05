import type { UUID } from "crypto";
import type { BrowserWindow } from "@/core/types";

export interface SessionSummary {
  title: string;
  tabsNumber: number;
  windowsNumber: number;
  dateSaved: number | undefined;
  dateModified: number | undefined;
  id: UUID | "current";
  tag?: string;
}

export interface Session extends SessionSummary {
  windows: BrowserWindow[];
}

export interface FilterOptions {
  query: string;
  sortMethod: SortMethod;
  tagsFilter: "__all__" | (string & NonNullable<unknown>);
}

export type Page = "popup" | "options" | "discarded";

export type Icon =
  | "default"
  | "copy"
  | "check"
  | "save"
  | "rename"
  | "delete"
  | "open"
  | "close"
  | "incognito"
  | "window"
  | "tab"
  | "global"
  | "extension"
  | "history"
  | "expand"
  | "collapse"
  | "tag"
  | "untag"
  | "search"
  | "settings"
  | "sort";

export interface UiNotification {
  type: "info" | "success" | "warning" | "error";
  msg: string;
  duration?: number;
}

export type URLFilterList = string[] | ["<all_urls>"] | undefined;

export type SortMethod = "newest" | "oldest" | "az" | "za" | "mostTabs";

export interface TagStyle {
  name?: string;
  bgColor: string;
  textColor: string;
}

export interface Settings {
  darkMode: boolean;
  popupView: boolean;
  selectionId: "current" | UUID;
  discarded: boolean;
  urlFilterList: URLFilterList;
  autoSave: boolean;
  autoSaveMaxSessions: number;
  autoSaveTimer: number;
  tags: Record<string, TagStyle>;
  doNotAskForTitle: boolean;
  excludePinned: boolean;
  exportCompressed: boolean;
  sortMethod: SortMethod;
  tagsFilter: "__all__" | (string & NonNullable<unknown>);
  updated: boolean;
}
