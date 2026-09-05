# Project

Tabitha — browser extension for saving, managing, and restoring browser sessions, windows, and tabs.

Stack: Svelte 5 + TypeScript + Vite 8 + UnoCSS + `idb` (IndexedDB) + `webextension-polyfill`. Package manager: **npm**; `name: tabitha`, `version: 0.1.0` (build mode `ALPHA`). Firefox ID `tabitha@tabitha` is a placeholder — change before AMO submission. ESLint 9 flat config lives in `eslint.config.js` (all recommended rules on). Most components are legacy Svelte-4 style; `Notification.svelte` is the first runes-mode component. Legacy reactive rules are satisfied by mutating store state through the store API (`sessions.selection.update`).

## Commands

```bash
npm run dev          # Chromium dev + vite server (dist/ is NOT standalone - see Dev-mode HMR hack)
npm run build        # Chromium production -> dist/
npm run build:ff     # Firefox production
npm run check        # svelte-check
npm run lint         # prettier --check && eslint
npm test             # vitest run
npm run format       # prettier --write
```

No browser test framework; `vitest` covers pure TS units (`*.test.ts` adjacent to modules). `check` + `lint` + `test` are the verification gates; `.github/workflows/ci.yml` runs all three plus both builds on every PR.

Line endings: `.gitattributes` forces LF (`* text=auto eol=lf`). Prettier's `endOfLine` defaults to `"lf"`, so without it `core.autocrlf` checks files out as CRLF and `npm run lint` fails on every file locally while passing in CI.

Load unpacked: `dist/` (Chromium `chrome://extensions`, Firefox `about:debugging`).

## Build pipeline

Two parallel outputs into one `dist/`, orchestrated by `npm-run-all2` (`run-p`):

| Step               | Config                      | Produces                                                      |
| ------------------ | --------------------------- | ------------------------------------------------------------- |
| `build-web`        | `vite.config.ts`            | `popup`, `options`, `discarded` HTML entries + Svelte bundles + `dist/manifest.json` (via `extensionManifestPlugin`) |
| `build-background` | `vite.config.background.ts` | `src/background/background.js`, **IIFE** format, single entry |

`tools/manifestPlugin.ts` (attached only to `build-web`) writes `dist/manifest.json` from `tools/buildManifest.ts` at `buildStart`, and in dev also injects the HMR script URLs into the view HTMLs. Only build-web carries the plugin, so there is exactly one manifest writer.

Gotchas:

- Both vite configs set `emptyOutDir: false` — they write into the same `dist/` concurrently. Never enable it.
- Prod manifest write uses `flag: 'wx'` — **fails if `dist/manifest.json` already exists**. Every script prefixes `npm run clean` for this reason. Dev writes overwrite (idempotent, port may change).
- Background must stay IIFE — MV3 service worker output is bundled flat, not ESM-chunked.
- Both vite configs set `minify: 'terser'`. The vite 8 default oxc minifier DCEs svelte's lazy runtime init (`init_operations`), yielding a black popup with `TypeError: Cannot read properties of undefined (reading 'call')` in the state chunk. Reproduces in a minimal hello-world svelte + vite 8 build; upstream unfixed. Do not revert to `'oxc'`.

## Build-time constants

`__EXT_NAME__`, `__EXT_VER__`, `__EXT_MODE__` are Vite `define` globals (`vite.config.ts`), sourced from `tools/constants.ts` + `process.env.npm_package_version`. Re-exported as `EXT_NAME`/`EXT_VER`/`EXT_MODE` from `src/core/constants/shared.ts`. `__EXT_MODE__` is `'ALPHA'` when major version `< 1`, `'DEV'` in dev, else `null`.

**Branding lives in `tools/constants.ts`** (`name`, `description`, `permissions`, `firefoxId`) — that file feeds both the manifest and the UI.

## Browser targeting

`TARGET=firefox` env var drives divergence at three levels:

- `tools/constants.ts` → `isFirefox` (build-time): permissions swap (`cookies` vs `system.display` + `favicon`, via `extension.permissions(firefox)`), Gecko `browser_specific_settings`.
- `src/core/constants/shared.ts` → `isFirefox = !!browser.runtime?.getBrowserInfo` (**runtime** detection, different mechanism): tab attributes (`cookieStoreId`/`isInReaderMode` vs `groupId`), favicon allowlist, favicon compression.
- `tools/buildManifest.ts` → background as `scripts[]` (FF) vs `service_worker` (Chromium).

Dev mode for Firefox **downgrades the manifest to MV2** and renames `action` → `browser_action` (`tools/buildManifest.ts`). Production Firefox stays MV3.

## Dev-mode HMR hack

`tools/manifestPlugin.ts` writes each view's `index.html` into `dist/`, replacing `"./main.ts"` with `"http://localhost:<port>/src/<view>/main.ts"`, and loosens `content_security_policy` to allow that port. `<port>` starts as the configured server port and is re-resolved from the dev server on `listening`, so a busy 5173 no longer 404s the pages. `chokidar` watches `src/**/*.html` and re-injects. Non-obvious consequence: **the dev `dist/` is not a valid standalone extension** — it 404s without the vite server running.

## Architecture

### Contexts

Four independent JS contexts, each instantiating its own copy of the Svelte store singletons:

- **background** (`src/background/background.ts`) — alarms (`tabitha-autosave`), context menus (`tabitha-save`, `tabitha-save-window`), message router for tab/window opening.
- **popup** (`src/popup/`) — the browser action panel.
- **full view** — the _same_ `src/popup/index.html` opened as a tab with `?tab=true`. `isPopup` (`src/core/constants/popup.ts`) is the only discriminator; `popup.svelte` redirects to full view and self-closes when `settings.popupView` is false.
- **options** (`src/options/`) — `open_in_tab: true`. Five pages behind a location-hash router (`General` / `Tags` / `Backup` / `Shortcuts` / `About`); `Tab.svelte` reads `location.href.split("#")[1]`, default `general`. Adding a page means a `<Tab>` plus a branch in `options.svelte`.

Plus **discarded** (`src/discarded/`) — a stub page used for lazy tab restore. Encodes real `url`/`title`/`icon` in query params, shows them as the tab's identity, then `location.href`-redirects on `visibilitychange`. Not a normal UI page.

### State

Two separate persistence layers — do not conflate:

- **Settings** → `browser.storage.local` via `src/core/utils/storage.ts` — all keys prefixed `tabitha.` (single choke point: `getStorageItem`/`getStorage`/`setStorage`). Shape is `Settings` (`src/core/types/extension.ts`); defaults live in the `settings` store IIFE.
- **Sessions** → IndexedDB via `SessionStore` singleton (`src/core/utils/database.ts`). DB `tabitha`, version 2, keyPath `id` (UUID), indexes `title` / `dateSaved` / `tag`.

State (`src/core/state/`) are IIFE-wrapped singletons exposing a curated API, not raw writables. `sessions` owns load/add/put/remove/removeAll/removeTab/selection; `settings` owns `changeSetting`; `tags` and `sessions.loaded` are derived.

`filtered` is a derived store wrapped in an IIFE. `sessions.filter` cursor-scans and deserializes **every** DB record, so the last query result is cached and reused when only `sortMethod` or `tagsFilter` changed. An identical set of filter options means the run came from `sessions`, not the filter UI, which invalidates the cache. A generation counter discards stale in-flight queries.

### Cross-context sync

Two channels, both required:

1. `browser.storage.local.onChanged` → `settings.onStorageChange` fans changes into the store, with side-effects on `darkMode` (theme) and `sortMethod`/`tagsFilter` (filter options). `selectionId` is **not** handled here — selection sync is channel B's job.
2. `browser.runtime.sendMessage({ message: 'dbChanged', sessions, selectedId })` → every context's `sessions` store listens, re-`set`s, and re-selects. Sent by `notify()` on every mutation (`add`/`put`/`remove`/`removeAll`/`select`), and by background after auto-save. The `sessions.select()` wrapper also selects locally, so selection updates without a storage echo.

`sendMessage` (`src/core/utils/messages.ts`) is an adapter over `browser.runtime.sendMessage` typed as a discriminated `Message` union; "no receiver" errors are swallowed internally (normal when no extension page is open). Background also accepts `openWindow` / `openTab` / `restoreSession` / `scheduleAutoSave` messages.

### Two session shapes

Session lists hold **hundreds** of tabs; hydrated windows must never be resident in list context. The type system enforces this:

- `SessionSummary` (`src/core/types/extension.ts`) — list shape: `title`, `tabsNumber`, `windowsNumber`, `dateSaved`, `dateModified`, `id`, `tag`. **No `windows` property.**
- `Session extends SessionSummary` — hydrated shape with real `windows: BrowserWindow[]`. Held only by `sessions.selection` and `currentSession`.

Rules:

- `sessionStore.iterateSessions` and `sessionStore.filterSessions` return `SessionSummary[]` (windows dropped per record via `toSummary`).
- `sessionStore.hydrate(summary)` is the only route to windows from a summary; `sessions.selectById` uses it.
- `sessions` store holds `SessionSummary[]`; `sessions.put()` takes a `Session` and writes back a `SessionSummary`.
- Any refactor that trusts a list item to have `windows` reintroduces the memory regression.

`iterateSessions` also batches: it invokes the callback every `maxBatch` records (50 on initial load) so the UI paints progressively.

### Import/export

`src/core/utils/backup/`. Own formats only:

- `.tab` — 5-byte ASCII magic `TBTH1` + lz-string `decompressFromUint8Array`
- `.tab.json` — plain JSON envelope `{ tabitha: 1, sessions }` via `TextDecoder`

Anything else is rejected with an error notification. `exportCompressed` setting selects `.tab` vs `.tab.json` on write.

### Styling

UnoCSS `presetUno` + `transformerDirectives` + `transformerVariantGroup`. Theme colors are **HSL CSS custom properties** with `<alpha-value>` placeholders, defined in `src/core/styles/global.css` and mapped one-to-one in `uno.config.ts`. Tokens are **semantic, not a numeric scale**: `page` / `panel` / `panel-alt` / `line` for surfaces, `ink` / `ink-muted` / `ink-faint` for text, `accent` / `accent-focus` / `accent-soft` / `accent-content` for the teal, plus `ochre` / `success` / `danger` / `link` / `tooltip`. Never reintroduce `surface-1..6`. Dark mode toggles via `applyTheme` (`src/core/utils/theme.ts`) adding `.dark` to `body`, not via UnoCSS dark variant config.

Fonts are self-hosted in `public/font/` and registered in `src/core/styles/fonts.css`: Inter (`font-sans`) and **Fraunces** (`font-display`, variable `opsz` 9–144). `font-mono` is a system stack with no file — it carries every uppercase micro-label (`.label` in `global.css`) and every count. Fraunces is optical-size aware: `h1`/`h2` default to `opsz 24`; add `.opsz-lg` for anything set at 20px or larger.

Shared classes: `.label` lives in `global.css` because both the popup and the options page use it. `.facts`, `.rule` and `.tool` live in `popup.css`, which **only the popup entry imports** — anything the options page needs must go in `global.css`.

### Path aliases

Declared **twice** and must be kept in sync: `tsconfig.json` `paths` and `vite.config.ts` `resolve.alias` (`sharedConfig`, inherited by the background config). Aliases: `@` → `src`, plus `@constants` → `src/core/constants`, `@utils` → `src/core/utils`, `@styles` → `src/core/styles`.

## TypeScript notes

`strict` + `noUncheckedIndexedAccess` + `noUnusedLocals` are on, and `allowJs`/`checkJs` are enabled. Indexed access returns `T | undefined`, which is why non-null assertions (`!`) are dense in existing code — that is deliberate, not sloppiness. `svelte-check` is the only type gate (`noEmit: true`).

## Known rough edges

Bullets below change how you write code against these modules.

- `settings.init()` has a `loaded` re-entrancy guard that resolves to `{} as Settings` after first run; the comment in `sessions.load` notes unresolved Firefox/Chrome inconsistency.
- `SessionStore.upgradeSessions` only handles the 1→2 migration; any schema bump needs a real migration path.
- `compress.ts` returns `undefined` on Chromium by design — all call sites must optional-chain.
- `sessions.put()` fails loud (`log.error`) when the target id is not in the store — mutate store contents only through the store API (`sessions.put`/`sessions.removeTab`), never by editing list items in place.
