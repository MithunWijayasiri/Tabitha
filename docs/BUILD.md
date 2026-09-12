# Build

Read before touching `tools/`, either vite config, or the manifest.

## Pipeline

Two outputs into one `dist/`, via `npm-run-all2` (`run-p`):

| Step               | Config                      | Produces                                                                      |
| ------------------ | --------------------------- | ----------------------------------------------------------------------------- |
| `build-web`        | `vite.config.ts`            | `popup` / `options` / `discarded` HTML + Svelte bundles + `dist/manifest.json` |
| `build-background` | `vite.config.background.ts` | `src/background/background.js`, **IIFE**, single entry                         |

`tools/manifestPlugin.ts` attaches only to `build-web` and writes the manifest at `buildStart` from `tools/buildManifest.ts` — exactly one manifest writer.

Gotchas:

- Both configs set `emptyOutDir: false` — they write the same `dist/` concurrently. Never enable it.
- Prod manifest write uses `flag: 'wx'` — **fails if `dist/manifest.json` already exists**. Every script prefixes `npm run clean`. Dev writes overwrite.
- Background must stay IIFE — MV3 service worker output is bundled flat, not ESM-chunked.
- Both configs set `minify: 'terser'`. Vite 8's default oxc minifier DCEs svelte's lazy `init_operations`, giving a black popup with `TypeError: Cannot read properties of undefined (reading 'call')`. Upstream unfixed. Never revert to `'oxc'`.

## Build-time constants

`__EXT_NAME__` / `__EXT_VER__` / `__EXT_MODE__` — Vite `define` globals from `tools/constants.ts` + `process.env.npm_package_version`, re-exported as `EXT_NAME` / `EXT_VER` / `EXT_MODE` from `src/core/constants/shared.ts`. `__EXT_MODE__` is `'ALPHA'` when major version `< 1`, `'DEV'` in dev, else `null`.

**Branding lives in `tools/constants.ts`** (`name`, `description`, `permissions`, `firefoxId`) — feeds both manifest and UI.

## Browser targeting

`TARGET=firefox` drives divergence at three levels:

- `tools/constants.ts` → `isFirefox`, **build-time**: permission swap (`cookies` vs `system.display` + `favicon`, via `extension.permissions(firefox)`), Gecko `browser_specific_settings`.
- `src/core/constants/shared.ts` → `isFirefox = !!browser.runtime?.getBrowserInfo`, **runtime**, a different mechanism: tab attributes (`cookieStoreId` / `isInReaderMode` vs `groupId`), favicon allowlist and compression.
- `tools/buildManifest.ts` → background as `scripts[]` (FF) vs `service_worker` (Chromium).

FF **dev** downgrades the manifest to MV2 and renames `action` → `browser_action` (`tools/buildManifest.ts`). FF production stays MV3.

## Dev-mode HMR hack

`tools/manifestPlugin.ts` rewrites each view's `index.html` to load `main.ts` from `http://localhost:<port>`, loosens `content_security_policy` for that port, and re-injects when `chokidar` sees a change under `src/**/*.html`. `<port>` starts as the configured server port and re-resolves from the dev server on `listening`, so a busy 5173 no longer 404s the pages.

Consequence: **dev `dist/` is not a valid standalone extension** — it 404s without the vite server running.
