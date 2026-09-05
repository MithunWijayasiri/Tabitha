const RE_SPECIAL = /[.*+?^${}()|[\]\\]/g;
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function highlightMatch(
  string: string,
  match: string,
  options: { all?: boolean; caseSensitive?: boolean } = {},
) {
  const escaped = string?.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);

  if (!match) return escaped;

  // match the escaped representation, so "&" hits "&amp;" whole
  const escapedMatch = match.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);

  const pattern = new RegExp(
    escapedMatch.replace(RE_SPECIAL, "\\$&"),
    `${options.all ? "g" : ""}${options.caseSensitive ? "" : "i"}`,
  );

  return escaped?.replace(pattern, "<mark>$&</mark>");
}
