import browser from "webextension-polyfill";
import { decompress as decompressLZ } from "lz-string";
import type { BrowserWindow, Session, BrowserTab } from "@/core/types";
import { isFirefox } from "@/core/constants/shared";
import { log } from "@/core/utils/log";
import { encodeDiscardedUrl } from "@/core/utils/discardedUrl";

export async function openInCurrentWindow(
  window: BrowserWindow,
  discarded?: boolean,
) {
  if (!window.tabs?.length) return;

  window.id = (await browser.windows.getCurrent()).id;

  for (const tab of window.tabs) {
    createTab(tab, window.id, discarded);
  }
}

declare const chrome: {
  system: {
    display: {
      getInfo: () => Promise<
        Array<{ bounds: { width: number; height: number } }>
      >;
    };
  };
};

export async function openInNewWindow(
  window: BrowserWindow,
  discarded?: boolean,
) {
  if (!window.tabs?.length) return;

  if (!isFirefox && window.state === "normal") {
    /**
     * @see https://source.chromium.org/chromium/chromium/src/+/d51682b36adc22496f45a8111358a8bb30914534
     */

    let screenWidth = 800;
    let screenHeight = 600;

    try {
      ({ width: screenWidth, height: screenHeight } = (
        await chrome.system.display.getInfo()
      )[0]?.bounds ?? {
        width: 800,
        height: 600,
      });
    } catch (error) {
      log.error("failed to get display info:", error);
    }

    window.top = window.top ?? 0;
    window.left = window.left ?? 0;
    window.height = window.height ?? screenHeight;
    window.width = window.width ?? screenWidth;

    if (window.height > screenHeight * 2) window.height = screenHeight;

    if (window.width > screenWidth * 2) window.width = screenWidth;

    if (window.top + window.height < screenHeight / 2) window.top = 0;

    if (window.top + window.height > screenHeight)
      window.top -= window.top + window.height - screenHeight;

    if (window.left + window.width < screenWidth / 2) window.left = 0;

    if (window.left + window.width > screenWidth)
      window.left -= window.left + window.width - screenWidth;
  }

  const windowId = (
    await browser.windows.create({
      incognito: window.incognito,
      ...(window.state !== "normal"
        ? { state: window.state }
        : {
            top: window.top,
            left: window.left,
            height: window.height,
            width: window.width,
          }),
    })
  ).id;

  for (const tab of window.tabs) {
    createTab(tab, windowId, discarded);
  }
}

export async function openSession(
  session: Session,
  newWindow?: boolean,
  discarded?: boolean,
) {
  for (const window of session.windows) {
    if (newWindow) {
      openInNewWindow(window, discarded);
      continue;
    }

    openInCurrentWindow(window, discarded);
  }
}

export async function createTab(
  tab: BrowserTab,
  windowId?: number,
  discarded?: boolean,
) {
  const {
    url,
    title,
    favIconUrl,
    active,
    pinned,
    cookieStoreId,
    isInReaderMode,
    mutedInfo,
    incognito,
  } = tab;

  if (!url) return;

  const lazyUrl =
    !isFirefox && !active && discarded
      ? encodeDiscardedUrl({
          url,
          title,
          icon: decompressLZ(favIconUrl ?? ""),
        })
      : url;

  try {
    return await browser?.tabs?.create({
      url: lazyUrl,
      active,
      windowId: windowId ?? tab.windowId,
      pinned,
      ...(isFirefox && {
        ...(!active && discarded && { title, discarded: true }),
        openInReaderMode: isInReaderMode,
        muted: mutedInfo?.muted,
        ...(!incognito && { cookieStoreId }),
      }),
    });
  } catch (error) {
    log.error("createTab failed:", url, error);
  }
}
