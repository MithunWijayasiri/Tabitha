import { decodeDiscardedUrl } from "@/core/utils/discardedUrl";

const params = decodeDiscardedUrl(location.href);

if (params) {
  if (params.title) document.title = params.title;

  if (params.icon) {
    const link = document.querySelector("link");

    link!.rel = "icon";
    link!.href = params.icon;
  }

  const { url } = params;

  const restore = () => {
    if (document.visibilityState !== "visible") return;

    // replace, not assign: the stub must not become a back-button destination.
    location.replace(url);
  };

  document.onvisibilitychange = restore;

  // The stub can load already-visible - a browser-discarded tab reloads on activation.
  restore();
}
