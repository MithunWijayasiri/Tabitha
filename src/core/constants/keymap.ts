export interface Keybinding {
  code: string;
  keys: string[];
  action: string;
  ctrl?: boolean;
}

export const keymap: Keybinding[] = [
  {
    code: "KeyK",
    keys: ["CTRL", "K"],
    action: "Open Command Palette",
    ctrl: true,
  },
  { code: "KeyS", keys: ["S"], action: "Save current session" },
  { code: "KeyR", keys: ["R"], action: "Rename selected session" },
  { code: "KeyF", keys: ["F"], action: "Focus search box" },
  { code: "KeyC", keys: ["C"], action: "Display current session" },
  { code: "KeyE", keys: ["E"], action: "Select next session" },
  { code: "KeyD", keys: ["D"], action: "Select previous session" },
  { code: "Delete", keys: ["Delete"], action: "Delete selected session" },
];

export function resolveKeybinding(ev: { code: string; ctrlKey: boolean }) {
  return keymap.find(
    (binding) =>
      binding.code === ev.code && (binding.ctrl ?? false) === ev.ctrlKey,
  );
}
