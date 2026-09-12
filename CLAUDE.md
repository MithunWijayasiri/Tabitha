# Project

Tabitha — browser extension for saving, managing and restoring sessions, windows and tabs.

Stack: Svelte 5 + TypeScript + Vite 8 + UnoCSS + `idb` (IndexedDB) + `webextension-polyfill`. npm. Build mode is `ALPHA` while major version `< 1`. Firefox ID `tabitha@tabitha` is a placeholder — change before AMO submission. Most components are legacy Svelte-4 style; `Notification.svelte` is the only runes-mode one. Legacy reactive rules are satisfied by mutating store state through the store API (`sessions.selection.update`).

## Commands

```bash
npm run dev          # Chromium dev + vite server (dist/ is NOT standalone — see Dev-mode HMR)
npm run build        # Chromium production -> dist/
npm run build:ff     # Firefox production
npm run check        # svelte-check
npm run lint         # prettier --check && eslint
npm test             # vitest run
npm run format       # prettier --write
```

`check` + `lint` + `test` are the gates; CI runs all three plus both builds per PR. No browser test framework — `vitest` covers pure TS units, `*.test.ts` adjacent to the module.

`.gitattributes` forces LF. Prettier's `endOfLine` defaults to `"lf"`, so without it `core.autocrlf` checks files out CRLF and `npm run lint` fails on every file locally while passing in CI.

Load unpacked from `dist/`.

## Build

`docs/BUILD.md` — **read it before touching `tools/`, either vite config, or the manifest.** It carries the two-output pipeline, the `TARGET=firefox` divergences, the build-time `define` globals, the dev HMR rewrite, and four gotchas that cost real time: `emptyOutDir: false`, the `flag: 'wx'` manifest write, background-must-stay-IIFE, and the terser-vs-oxc black popup.

Two consequences leak into everyday work: **dev `dist/` is not a standalone extension** (it 404s without the vite server), and branding lives in `tools/constants.ts`, not in the UI.

## Architecture

### Contexts

Four independent JS contexts, each with its own copy of the store singletons:

- **background** (`src/background/background.ts`) — alarms (`tabitha-autosave`), context menus (`tabitha-save`, `tabitha-save-window`), message router for tab/window opening.
- **popup** (`src/popup/`) — the browser action panel.
- **full view** — the _same_ `src/popup/index.html` opened as a tab with `?tab=true`. `isPopup` (`src/core/constants/popup.ts`) is the only discriminator; `popup.svelte` redirects and self-closes when `settings.popupView` is false.
- **options** (`src/options/`) — `open_in_tab: true`. Five pages behind a hash router (`General` / `Tags` / `Backup` / `Shortcuts` / `About`); `Tab.svelte` reads `location.href.split("#")[1]`, default `general`. A new page means a `<Tab>` plus a branch in `options.svelte`.

Plus **discarded** (`src/discarded/`) — stub page for lazy tab restore. Carries real `url`/`title`/`icon` in query params, shows them as the tab's identity, then `location.href`-redirects on `visibilitychange`. Not a normal UI page.

### State

Two persistence layers — do not conflate:

- **Settings** → `browser.storage.local` via `src/core/utils/storage.ts`, all keys prefixed `tabitha.` (choke point: `getStorageItem` / `getStorage` / `setStorage`). Shape is `Settings` (`src/core/types/extension.ts`); defaults live in the `settings` IIFE.
- **Sessions** → IndexedDB via the `SessionStore` singleton (`src/core/utils/database.ts`). DB `tabitha` v3, keyPath `id` (UUID), indexes `title` / `dateSaved` / `tag`.

Stores (`src/core/state/`) are IIFE singletons exposing a curated API, not raw writables.

**Writes queue.** Every `sessions` mutation — `add`, `addBackup`, `put`, `remove`, `removeAll`, `removeTab` — goes through one FIFO queue (`createSerializer`, `src/core/utils/serialize.ts`); background holds a second instance for its alarm and context-menu handlers. Queued, never dropped: `add` returning `undefined` means the save failed, never that it was skipped. `busy` is true from enqueue until the queue drains. Add a new mutation to the queue, not beside it. Internal callers (`put` → `remove`, `deleteTab` → `put`) use the raw functions — a queued call from inside a queued slot deadlocks. A held key would fire once per auto-repeat, so `Commands.svelte` drops `ev.repeat`.

The queues are per-context and cannot serialise a background save against a popup save, which share the `lastSaved` guard. `saveSession` therefore reads that guard **after** the tab read, narrowing the overlap to persist + claim. Narrowed, not closed — closing it needs popup saves routed through background.

**`currentSession`** is owned by `src/core/state/currentSession.ts`, not by a component. `createCurrentSessionReader(ports)` holds the tab/window listeners, the 50 ms debounce and the `getSession` call, taking every browser effect as an injected port so it is testable (`currentSession.test.ts`). `sessions.ts` wires the real ports and is the only place deciding **where** "current" is read — in every context that loads the store, options included. `load()` awaits `current.ready`, so `selectionId: "current"` resolves against a session actually read. `ready` settles after the first read **attempt**, failure included — gating it on success would leave `load()` pending and `loaded` false forever after one rejection. So a failed read leaves `currentSession` `undefined`: `sessions.add` and `sessions.select` guard for it, and so must any other reader of `get(currentSession)`.

**`filtered`** is a derived store in an IIFE. `sessions.filter` cursor-scans and deserializes **every** record, so the last result is cached and reused when only `sortMethod` or `tagsFilter` changed. Identical filter options mean the run came from `sessions`, not the filter UI — that invalidates the cache. A generation counter discards stale in-flight queries.

### Commands

Every action reachable by key, palette entry or session-row button is one row of `src/core/commands.ts`: `{ id?, title, hint?, palette, run }`. `id` is a `CommandId` from `keymap.ts`; `title` and `hint` **derive** from that binding, never written twice. Rebinding a key is a one-file edit in `src/core/constants/keymap.ts`.

- `commands` derives over a `ports` store. `provideCommandPorts(partial)` registers a context's affordances (`promptTitle`, `focusSearch`, `reveal`, `visibleSessions`) and returns the `onMount` unregister. Ports are optional by design: the options page has no list and no search box, so `save` falls back to a timestamp title and `next`/`previous` no-op.
- `runCommand(id)` is the only entry point; it throws on an unbound id.
- `Commands.svelte` (`basic/`) is the **single** `<svelte:window on:keydown>`, one per context, mounted by `popup.svelte` and `options.svelte`. It also renders the palette and the shared confirm modal from `paletteOpen` / `confirmRequest`.
- `CommandPalette.svelte` is presentational — filters on `palette: true`, renders `hint`.

Never add a second window keydown listener. Never hand-write a palette hint.

### Cross-context sync

Two channels, both required:

1. `browser.storage.local.onChanged` → `settings.onStorageChange` fans changes into the store, with side-effects on `sortMethod` / `tagsFilter`. `selectionId` is **not** handled here — that is channel 2's job.
2. `sendMessage({ message: 'dbChanged', sessions, selectedId })` → every context's `sessions` store re-`set`s and re-selects. Sent by `notify()` on every mutation and by background after auto-save. `sessions.select()` also selects locally, so selection updates without a storage echo.

`sendMessage` (`src/core/utils/messages.ts`) wraps `browser.runtime.sendMessage` with a discriminated `Message` union; "no receiver" errors are swallowed (normal when no extension page is open). Background also accepts `openWindow` / `openTab` / `restoreSession` / `scheduleAutoSave`.

### Two session shapes

Session lists hold **hundreds** of tabs; hydrated windows must never be resident in list context. The types enforce it:

- `SessionSummary` (`src/core/types/extension.ts`) — list shape. **No `windows` property.** `sites` is a `SiteCount[]` of top domains counted at save time, so a row shows a domain breakdown without holding windows.
- `Session extends SessionSummary` — hydrated, real `windows: BrowserWindow[]`. Held only by `sessions.selection` and `currentSession`.

Rules:

- `iterateSessions` and `filterSessions` return `SessionSummary[]` (windows dropped per record via `toSummary`).
- `sessionStore.hydrate(summary)` is the only route from a summary to windows; `sessions.selectById` uses it.
- `sessions` holds `SessionSummary[]`; `sessions.put()` takes a `Session` and writes back a `SessionSummary`.
- Any refactor that trusts a list item to have `windows` reintroduces the memory regression.

`iterateSessions` batches: the callback fires every `maxBatch` records (50 on initial load) so the UI paints progressively.

### Import/export

`src/core/utils/backup/`. Own formats only:

- `.tab` — 5-byte ASCII magic `TBTH1` + lz-string `decompressFromUint8Array`
- `.tab.json` — JSON envelope `{ tabitha: 1, sessions }` via `TextDecoder`

Anything else is rejected with an error notification. `exportCompressed` picks `.tab` vs `.tab.json` on write.

### Styling

UnoCSS `presetUno` + `transformerDirectives` + `transformerVariantGroup`. Theme colors are HSL custom properties with `<alpha-value>` placeholders in `src/core/styles/global.css`, mapped one-to-one in `uno.config.ts`. Tokens are **semantic, not a numeric scale**: `page` / `panel` / `panel-alt` / `line` (surfaces), `ink` / `ink-muted` / `ink-faint` (text), `accent` / `accent-focus` / `accent-soft` / `accent-content` (teal), plus `ochre` / `success` / `danger` / `link` / `tooltip`. Never reintroduce `surface-1..6`. **Light only** — no dark palette, no `.dark`, no `darkMode` setting; all three were removed deliberately.

Fonts self-hosted in `public/font/`, registered in `fonts.css`: Inter (`font-sans`), Oswald (`font-display`, variable 200–700, split latin / latin-ext by `unicode-range`). `h1` / `h2` take `font-display` globally. `font-mono` is a system stack with no file — it carries every uppercase micro-label (`.label`) and every count.

`.label` lives in `global.css` because popup and options both use it. `.facts`, `.rule` and `.tool` live in `popup.css`, which **only the popup entry imports** — anything options needs goes in `global.css`.

### Path aliases

Declared **twice** and must be kept in sync: `tsconfig.json` `paths` and `vite.config.ts` `resolve.alias` (`sharedConfig`, inherited by the background config). `@` → `src`, `@constants` → `src/core/constants`, `@utils` → `src/core/utils`, `@styles` → `src/core/styles`.

## TypeScript notes

`strict` + `noUncheckedIndexedAccess` + `noUnusedLocals`, plus `allowJs`/`checkJs`. Indexed access returns `T | undefined`, so non-null assertions (`!`) are dense in existing code — deliberate, not sloppiness. `svelte-check` is the only type gate (`noEmit: true`).

## Known rough edges

- `settings.init()` has a `loaded` re-entrancy guard resolving to `{} as Settings` after first run; `sessions.load`'s comment notes an unresolved Firefox/Chrome inconsistency.
- `SessionStore.upgradeSessions` handles 1→2 (`tags` → `tag`, index swapped) and →3 (backfills `sites` via `countSites`); a further schema bump needs a new branch. Passed as a bare callback (`upgrade: this.upgradeSessions`), so it must never touch `this`.
- `compress.ts` returns `undefined` on Chromium by design — all call sites must optional-chain.
- `sessions.put()` fails loud (`log.error`) when the target id is not in the store. Mutate store contents only through the store API, never by editing list items in place.
