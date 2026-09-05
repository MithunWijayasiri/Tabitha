import browser from "webextension-polyfill";
import type { UUID } from "crypto";
import type {
  Session,
  SessionSummary,
  BrowserTab,
  BrowserWindow,
} from "@/core/types";
import { log } from "@/core/utils/log";

export type Message =
  | {
      message: "dbChanged";
      sessions: SessionSummary[];
      selectedId?: UUID | "current";
    }
  | { message: "openWindow"; window: BrowserWindow; discarded?: boolean }
  | { message: "openTab"; tab: BrowserTab; discarded?: boolean }
  | { message: "restoreSession"; session: Session; discarded?: boolean }
  | { message: "scheduleAutoSave" };

export function sendMessage(msg: Message) {
  return browser.runtime.sendMessage(msg).catch((error) => {
    // no receiver is the normal case when no extension page is open
    if (!String(error).includes("Receiving end does not exist"))
      log.error("sendMessage failed:", error);
  });
}
