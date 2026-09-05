import { isFirefox } from "@/core/constants";

export function getScrollbarPadding(el: HTMLElement | undefined) {
  const hasScrollbar = !!el && el.scrollHeight > el.clientHeight;

  // Zero keeps its unit so call sites can use the result inside calc().
  return hasScrollbar ? (isFirefox ? "1rem" : "0.5rem") : "0rem";
}
