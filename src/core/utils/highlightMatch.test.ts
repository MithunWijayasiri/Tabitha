import { describe, expect, it } from "vitest";
import { highlightMatch } from "./highlightMatch";

describe("highlightMatch", () => {
  it("is case-insensitive by default", () => {
    expect(highlightMatch("Hello World", "hello")).toBe(
      "<mark>Hello</mark> World",
    );
  });

  it("respects the caseSensitive flag", () => {
    expect(highlightMatch("Hello", "hello", { caseSensitive: true })).toBe(
      "Hello",
    );
    expect(highlightMatch("Hello", "Hello", { caseSensitive: true })).toBe(
      "<mark>Hello</mark>",
    );
  });

  it("marks all occurrences with the all flag", () => {
    expect(highlightMatch("a a a", "a", { all: true })).toBe(
      "<mark>a</mark> <mark>a</mark> <mark>a</mark>",
    );
  });

  it("marks only the first occurrence by default", () => {
    expect(highlightMatch("a a", "a")).toBe("<mark>a</mark> a");
  });

  it("escapes regex metacharacters in the query", () => {
    expect(highlightMatch("(a)", "(")).toBe("<mark>(</mark>a)");
  });

  it("HTML-escapes the input", () => {
    expect(highlightMatch("<script>x</script>", "script")).toBe(
      "&lt;<mark>script</mark>&gt;x&lt;/script&gt;",
    );
  });

  it("HTML-escapes with an empty query", () => {
    expect(highlightMatch("<b>a & b</b>", "")).toBe("&lt;b&gt;a &amp; b&lt;/b&gt;");
  });
});
