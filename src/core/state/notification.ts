import type { UiNotification } from "@/core/types";
import { writable, type Writable } from "svelte/store";
import { log } from "@/core/utils";

export const notification = (() => {
  const { subscribe, set }: Writable<UiNotification> = writable();

  function notify(
    type: UiNotification["type"],
    msg: string,
    debugMsg?: string,
    logLevel: "info" | "warn" | "error" = type === "error"
      ? "error"
      : type === "warning"
        ? "warn"
        : "info",
  ) {
    set({ type, msg });
    if (debugMsg) log[logLevel](debugMsg);
  }

  return {
    subscribe,
    set,
    info: (msg: string, debugMsg?: string) => notify("info", msg, debugMsg),
    success: (msg: string, debugMsg?: string) =>
      notify("success", msg, debugMsg),
    warning: (msg: string, debugMsg?: string) =>
      notify("warning", msg, debugMsg),
    error: (msg: string, debugMsg?: string) => notify("error", msg, debugMsg),

    // For actions that succeeded but are dangerous and require care such as deleting
    success_warning: (msg: string, debugMsg?: string) =>
      notify("warning", msg, debugMsg, "info"),

    // For actions that succeeded but not necessarily requiring attention
    success_info: (msg: string, debugMsg?: string) =>
      notify("info", msg, debugMsg),
  };
})();
