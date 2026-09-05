import { decodeDiscardedUrl } from "@/core/utils/discardedUrl";

const params = decodeDiscardedUrl(location.href);

if (params) {
  if (params.title) document.title = params.title;

  if (params.icon) {
    const link = document.querySelector("link");

    link!.rel = "icon";
    link!.href = params.icon;
  }

  document.onvisibilitychange = () => {
    if (document.visibilityState === "visible") location.href = params.url;
  };
}
