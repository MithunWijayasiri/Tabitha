export type CommandId =
  | "palette"
  | "save"
  | "rename"
  | "search"
  | "current"
  | "next"
  | "previous"
  | "delete";

export interface Keybinding {
  id: CommandId;
  code: string;
  keys: string[];
  action: string;
  ctrl?: boolean;
}

// The only place a key, its label and its command id are written down.
export const keymap: Keybinding[] = [
  {
    id: "palette",
    code: "KeyK",
    keys: ["CTRL", "K"],
    action: "Open Command Palette",
    ctrl: true,
  },
  { id: "save", code: "KeyS", keys: ["S"], action: "Save current session" },
  {
    id: "rename",
    code: "KeyR",
    keys: ["R"],
    action: "Rename selected session",
  },
  { id: "search", code: "KeyF", keys: ["F"], action: "Focus search box" },
  {
    id: "current",
    code: "KeyC",
    keys: ["C"],
    action: "Display current session",
  },
  { id: "next", code: "KeyE", keys: ["E"], action: "Select next session" },
  {
    id: "previous",
    code: "KeyD",
    keys: ["D"],
    action: "Select previous session",
  },
  {
    id: "delete",
    code: "Delete",
    keys: ["Delete"],
    action: "Delete selected session",
  },
];

export function resolveKeybinding(ev: { code: string; ctrlKey: boolean }) {
  return keymap.find(
    (binding) =>
      binding.code === ev.code && (binding.ctrl ?? false) === ev.ctrlKey,
  );
}

export function bindingFor(id: CommandId) {
  const binding = keymap.find((entry) => entry.id === id);

  if (!binding) throw new Error(`keymap has no binding for "${id}"`);

  return binding;
}
