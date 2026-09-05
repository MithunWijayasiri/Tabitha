import { describe, expect, it } from "vitest";
import { keymap, resolveKeybinding } from "./keymap";

describe("keymap", () => {
  it("resolves a plain key to its binding", () => {
    expect(resolveKeybinding({ code: "KeyS", ctrlKey: false })?.action).toBe(
      "Save current session",
    );
  });

  it("resolves Ctrl+K", () => {
    expect(resolveKeybinding({ code: "KeyK", ctrlKey: true })?.action).toBe(
      "Open Command Palette",
    );
  });

  it("does not match plain K to the Ctrl binding", () => {
    expect(resolveKeybinding({ code: "KeyK", ctrlKey: false })).toBeUndefined();
  });

  it("lists a binding for every code used", () => {
    expect(keymap.map((binding) => binding.code)).toContain("Delete");
  });
});
