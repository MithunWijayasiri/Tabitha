export function isInputTarget(target: HTMLElement) {
  return (
    ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable
  );
}

export function shouldIgnoreShortcut(
  ev: KeyboardEvent,
  allowCtrl: boolean = false,
) {
  return (
    (ev.target instanceof HTMLElement && isInputTarget(ev.target)) ||
    ev.repeat ||
    (!allowCtrl && ev.ctrlKey) ||
    ev.shiftKey ||
    ev.altKey ||
    ev.metaKey
  );
}
