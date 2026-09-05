import { get } from "svelte/store";
import { settings } from "@/core/state";
import type { TagStyle } from "@/core/types";

export function addTag(name: string, style: TagStyle) {
  const tags = get(settings).tags;

  tags[name] = style;

  settings.changeSetting("tags", tags);
}
