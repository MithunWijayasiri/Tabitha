import { settings } from "@/core/state";

export function handleFilterListChange(
  ev: Event & { currentTarget: EventTarget & HTMLTextAreaElement },
  previousValue: string,
) {
  const value = ev.currentTarget.value;

  const urls = value.match(
    /(\b(https?|ftp|file)|\B\*):\/{2}(\*|(\*\.)?[^*/\s:]*)\/[^\s]*/g,
  );

  settings.changeSetting("urlFilterList", urls ?? undefined);

  // revert invalid input back to the last stored value
  if (!urls) ev.currentTarget.value = previousValue;
}
