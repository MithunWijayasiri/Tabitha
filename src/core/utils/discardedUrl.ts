import { pageUrl } from "@/core/utils/extension";

export interface DiscardedParams {
  url: string;
  title?: string;
  icon?: string;
}

export function encodeDiscardedUrl({ url, title, icon }: DiscardedParams) {
  const params = new URLSearchParams({ url });
  if (title) params.set("title", title);
  if (icon) params.set("icon", icon);
  return `src/discarded/index.html?${params}`;
}

export function decodeDiscardedUrl(href: string): DiscardedParams | undefined {
  try {
    const params = new URLSearchParams(new URL(href).search);
    const url = params.get("url");
    if (!url) return undefined;
    return {
      url,
      title: params.get("title") ?? undefined,
      icon: params.get("icon") ?? undefined,
    };
  } catch {
    return undefined;
  }
}

export function isDiscardedUrl(href: string) {
  return href.startsWith(pageUrl("discarded"));
}
