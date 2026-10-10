# Project

Tabitha — browser extension for saving, managing and restoring sessions, windows and tabs.

Stack: Svelte 5 + TypeScript + Vite 8 + UnoCSS + `idb` (IndexedDB) + `webextension-polyfill`. npm. Build mode is `ALPHA` while major version `< 1`. Firefox ID `tabitha@mithunwijayasiri.dev` (`tools/constants.ts`) — never change it after AMO release; it identifies the add-on for updates. Most components are legacy Svelte-4 style; `Notification.svelte` is the only runes-mode one. Legacy reactive rules are satisfied by mutating store state through the store API (`sessions.selection.update`).

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
- **options** (`src/options/`) — hash-routed settings pages. Detail: `.claude/rules/options-page.md`.

Plus **discarded** (`src/discarded/`) — stub page for lazy tab restore. Carries real `url`/`title`/`icon` in query params, shows them as the tab's identity, then `location.href`-redirects on `visibilitychange`. Not a normal UI page.

### State

Two persistence layers — do not conflate:

- **Settings** → `browser.storage.local` via `src/core/utils/storage.ts`, all keys prefixed `tabitha.` (choke point: `getStorageItem` / `getStorage` / `setStorage`). Shape is `Settings` (`src/core/types/extension.ts`); defaults live in the `settings` IIFE.
- **Sessions** → IndexedDB via the `SessionStore` singleton (`src/core/utils/database.ts`). DB `tabitha` v3, keyPath `id` (UUID), indexes `title` / `dateSaved` / `tag`.

Invariants that hold everywhere (detail in `.claude/rules/session-state.md`):

- List items are `SessionSummary` — **no `windows`**. Only `sessions.selection` and `currentSession` hold a hydrated `Session`; `sessionStore.hydrate` is the only route between them. Trusting a list item to have `windows` reintroduces the memory regression.
- Every `sessions` mutation goes through the one FIFO write queue. New mutation → add it to the queue.
- `get(currentSession)` can be `undefined` (failed read) — every reader guards for it.

### Commands

Every action reachable by key, palette entry or session-row button is one row of `src/core/commands.ts`; keys live in `src/core/constants/keymap.ts`. Never add a second window keydown listener — `Commands.svelte` is the only one. Detail: `.claude/rules/commands.md`.

### Cross-context sync

Two channels, both required:

1. `browser.storage.local.onChanged` → `settings.onStorageChange` fans changes into the store, with side-effects on `sortMethod` / `tagsFilter`. `selectionId` is **not** handled here — that is channel 2's job.
2. `sendMessage({ message: 'dbChanged', sessions, selectedId })` → every context's `sessions` store re-`set`s and re-selects. Sent by `notify()` on every mutation and by background after auto-save. `sessions.select()` also selects locally, so selection updates without a storage echo.

`sendMessage` (`src/core/utils/messages.ts`) wraps `browser.runtime.sendMessage` with a discriminated `Message` union; "no receiver" errors are swallowed (normal when no extension page is open). Background also accepts `openWindow` / `openTab` / `restoreSession` / `scheduleAutoSave`.

### Area rules

Path-scoped, loaded when a matching file is read — `.claude/rules/`:

- `session-state.md` — write queue, `currentSession`, `filtered` cache, two session shapes
- `commands.md` — command table, ports, palette
- `styling.md` — UnoCSS tokens, fonts, shared classes (light only)
- `backup.md` — `.tab` / `.tab.json` import/export
- `options-page.md` — hash router, adding a page
- `background.md` — MV3 service worker / Firefox event page lifecycle
- `manifest-and-permissions.md` — permissions, remote code, CSP, AMO source review
- `persisted-data.md` — settings keys and IndexedDB schema migrations
- `rough-edges.md` — known quirks in `src/core` and `src/background`

Change contradicts or extends a rule (or this file) → update it in the same change; new area-specific invariant → add it to the matching rule, not here.

### Path aliases

Declared **twice** and must be kept in sync: `tsconfig.json` `paths` and `vite.config.ts` `resolve.alias` (`sharedConfig`, inherited by the background config). `@` → `src`, `@constants` → `src/core/constants`, `@utils` → `src/core/utils`, `@styles` → `src/core/styles`.

## TypeScript notes

`strict` + `noUncheckedIndexedAccess` + `noUnusedLocals`, plus `allowJs`/`checkJs`. Indexed access returns `T | undefined`, so non-null assertions (`!`) are dense in existing code — deliberate, not sloppiness. `svelte-check` is the only type gate (`noEmit: true`).
