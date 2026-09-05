const timeInMS = {
  Year: 31536000000,
  Month: 2628000000,
  Day: 86400000,
  Hour: 3600000,
  Minute: 60000,
};

const labels: Record<keyof typeof timeInMS, string> = {
  Year: "yr",
  Month: "mo",
  Day: "day",
  Hour: "hr",
  Minute: "min",
};

export function getRelativeTime(date: number) {
  const elapsed = Date.now() - date;

  for (const unit in timeInMS) {
    if (elapsed > timeInMS[unit as keyof typeof timeInMS]) {
      const val = Math.round(elapsed / timeInMS[unit as keyof typeof timeInMS]);

      return `${val} ${labels[unit as keyof typeof labels]}`;
    }
  }

  return "just now";
}
