
<h1 align="center">Tabitha</h1>

<p align="center">
  Capture browser windows and tabs as sessions, then restore them whenever you need.
</p>

<p align="center">
  <img src="./assets/github-banner.png" alt="Tabitha banner" width="1024">
</p>

## What it does

Tabitha saves your open windows and tabs as a named session and puts them back later. Sessions hold hundreds of tabs, and restoring one is cheap because each tab loads only when you first click it.

- Save, rename, tag, and restore sessions
- Save automatically on a timer
- Restore a whole session, one window, or one tab
- Search session names and tab titles together
- Limit what gets saved with [match patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns)
- Import and export as `.tab` or `.tab.json`
- Light and dark themes
- Chrome, Firefox, Edge, and Opera

Nothing is sent anywhere. Sessions live in your own browser, and the only way data leaves is a file you export.

> [!IMPORTANT]
> Tabitha is at version 0.1.0 and builds in `ALPHA` mode. The session database is still changing shape. Export your sessions from **Settings → Backup** before you update.

## Install

No store listing yet, so build it and load it unpacked.

```bash
npm install
npm run build        # Chromium
npm run build:ff     # Firefox
```

- **Chrome, Edge, Opera** — open `chrome://extensions`, turn on Developer mode, click **Load unpacked**, pick `dist/`.
- **Firefox** — open `about:debugging`, click **This Firefox**, then **Load Temporary Add-on**, pick any file in `dist/`.

Or let `web-ext` open a clean profile with it already loaded:

```bash
npm run open         # Chromium
npm run open:ff      # Firefox
```

## Shortcuts

| Keys       | Action                      |
| ---------- | --------------------------- |
| `Ctrl` `K` | Open the command palette    |
| `S`        | Save the current session    |
| `R`        | Rename the selected session |
| `F`        | Focus the search box        |
| `C`        | Show the current session    |
| `E`        | Select the next session     |
| `D`        | Select the previous session |
| `Delete`   | Delete the selected session |

## Development

```bash
npm run dev      # Chromium, with hot reload
npm run check    # svelte-check, the type gate
npm run lint     # prettier --check and eslint
npm run test     # vitest
```

`check`, `lint`, and `test` all have to pass. The dev build of `dist/` needs the Vite server running, so build with `npm run build` before handing the folder to anyone.

Svelte 5, TypeScript, Vite 8, UnoCSS, `idb`, `webextension-polyfill`. `CLAUDE.md` covers the build pipeline and architecture; planned features are in [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## License

[MIT](./LICENSE)
