---
paths:
  - "src/background/**"
---

# Background context

Chromium runs it as an MV3 service worker, Firefox as a non-persistent event page. Both are killed when idle and restarted per event.

- Register every listener synchronously at top level of `background.ts`. A listener added inside `await` / a callback misses the event that woke the worker.
- No state in module globals that must outlive one event — it resets on restart. Persist to `browser.storage.local` or IndexedDB. (`serialize` is fine: it only orders in-flight work.)
- Timers that must survive idle → `browser.alarms`, never `setTimeout` / `setInterval`. No keep-alive hacks.
- No DOM (`document`, `window`, `Image`, canvas) — the Chromium service worker has none, but the Firefox event page does, so DOM code passes on Firefox and crashes Chromium. `compress.ts` gets away with it only by returning `undefined` on Chromium.
- `browser.*` (polyfill) everywhere. `chrome.*` only for a Chromium-only API the polyfill lacks, behind `!isFirefox` (e.g. `chrome.system.display` in `utils/browser.ts`).
- `onInstalled` is the place for one-time setup (context menus) and update work (`reason === "update"`); it does not fire on plain worker restarts.
