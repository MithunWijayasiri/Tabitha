import type { BrowserWindow, SiteCount } from "@/core/types";
import { getDomain } from "./getDomain";

const maxSites = 3;

// Only the top few are kept — a list row must stay small however many tabs it covers.
export function countSites(windows: BrowserWindow[]): SiteCount[] {
  const counts = new Map<string, number>();

  for (const window of windows)
    for (const tab of window.tabs ?? []) {
      const domain = getDomain(tab.url);

      if (!domain) continue;

      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }

  return [...counts]
    .sort(([aDomain, aCount], [bDomain, bCount]) =>
      bCount === aCount ? aDomain.localeCompare(bDomain) : bCount - aCount,
    )
    .slice(0, maxSites)
    .map(([domain, count]) => ({ domain, count }));
}

/* Drops the suffix on plain two-label hosts only; bbc.co.uk and docs.google.com
   need a public-suffix list to shorten safely, so they stay whole. */
export function siteLabel(domain: string) {
  const labels = domain.split(".");

  return labels.length === 2 ? labels[0]! : domain;
}
