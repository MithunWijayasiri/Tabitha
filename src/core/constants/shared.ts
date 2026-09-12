import browser from "webextension-polyfill";
import type { CompressOptions, Icon, TagStyle } from "@/core/types";

export const EXT_NAME = __EXT_NAME__;
export const EXT_VER = __EXT_VER__;
export const EXT_MODE = __EXT_MODE__;

export const isDEV = import.meta.env.DEV;

export const isFirefox = !!browser.runtime?.getBrowserInfo;

export const baseUrl = browser.runtime.getURL("");

export const tabAttr = [
  "id",
  "title",
  "url",
  "favIconUrl",
  "active",
  "discarded",
  "pinned",
  "incognito",
  "mutedInfo",
  ...(isFirefox ? ["isInReaderMode", "cookieStoreId"] : ["groupId"]),
] as const;

export const compressOptions: CompressOptions = {
  type: "image/webp",
  quality: 0.7,
  maxSize: 20,
};

export const autoSaveDefaults = {
  autoSave: false,
  autoSaveMaxSessions: 5,
  autoSaveTimer: 15,
} as const;

export const favIconAllowedList: string[] = [
  "http",
  "data:image",
  ...(isFirefox ? ["chrome://branding"] : []),
];

export const favIconDisallowedList: Record<string, Icon> = {
  "about:addons": "extension",
  "about:preferences": "settings",
};

// Poster palette offered as tag swatches; new tags take the first entry.
export const tagColors = [
  "#b8801e",
  "#0e5d51",
  "#cf4630",
  "#1c5f7a",
  "#101a17",
  "#f6e3be",
];

export const defaultTagStyle: TagStyle = {
  bgColor: "#b8801e",
  textColor: "#f6e3be",
};
