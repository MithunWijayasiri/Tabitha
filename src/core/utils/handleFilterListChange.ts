import { settings } from "@/core/state";

export function handleFilterListChange(
  ev: Event & { currentTarget: EventTarget & HTMLTextAreaElement },
  previousValue: string,
) {
  const value = ev.currentTarget.value;

  const urls = value.match(
    /(\b(https?|ftp|file)|\B\*):\/{2}(\*|(\*\.)?[^*/\s:]*)\/[^\s]*/g,
  );

  // revert invalid input rather than clearing the stored list
  if (!urls) {
    ev.currentTarget.value = previousValue;
    return;
  }

  settings.changeSetting("urlFilterList", urls);

  // drop any unmatched text so the textarea shows exactly what was stored
  ev.currentTarget.value = urls.join("\n");
}
