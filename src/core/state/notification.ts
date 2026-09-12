import type { UiNotification } from "@/core/types";
import { writable, type Writable } from "svelte/store";
import { log } from "@/core/utils";

export const notification = (() => {
  const { subscribe, set }: Writable<UiNotification> = writable();

  function notify(
    type: UiNotification["type"],
    msg: string,
    detail?: string,
    logLevel: "info" | "warn" | "error" = type === "error"
      ? "error"
      : type === "warning"
        ? "warn"
        : "info",
  ) {
    set({ type, msg, detail });
    if (detail) log[logLevel](`${msg}: ${detail}`);
  }

  return {
    subscribe,
    set,
    info: (msg: string, detail?: string) => notify("info", msg, detail),
    success: (msg: string, detail?: string) => notify("success", msg, detail),
    warning: (msg: string, detail?: string) => notify("warning", msg, detail),
    error: (msg: string, detail?: string) => notify("error", msg, detail),

    // For actions that succeeded but are dangerous and require care such as deleting
    success_warning: (msg: string, detail?: string) =>
      notify("warning", msg, detail, "info"),

    // For actions that succeeded but not necessarily requiring attention
    success_info: (msg: string, detail?: string) => notify("info", msg, detail),
  };
})();
