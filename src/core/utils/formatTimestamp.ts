// Fixed locale: the title is stored as text and travels with .tab exports.
const format = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatTimestamp(date: number) {
  return format.format(date);
}
