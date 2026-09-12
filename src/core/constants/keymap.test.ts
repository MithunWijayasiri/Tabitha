import { describe, expect, it } from "vitest";
import { bindingFor, keymap, resolveKeybinding } from "./keymap";

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
    expect(keymap.map((binding) => binding.code)).toEqual([
      "KeyK",
      "KeyS",
      "KeyR",
      "KeyF",
      "KeyC",
      "KeyE",
      "KeyD",
      "Delete",
    ]);
  });

  it("gives every binding a unique command id", () => {
    const ids = keymap.map((binding) => binding.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves a command id back to its binding", () => {
    expect(bindingFor("delete").code).toBe("Delete");
    // @ts-expect-error deliberately outside CommandId
    expect(() => bindingFor("nope")).toThrow();
  });
});
