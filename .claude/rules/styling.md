---
paths:
  - "src/**/*.svelte"
  - "src/**/*.css"
  - "uno.config.ts"
---

# Styling

UnoCSS `presetUno` + `transformerDirectives` + `transformerVariantGroup`. Theme colors are HSL custom properties with `<alpha-value>` placeholders in `src/core/styles/global.css`, mapped one-to-one in `uno.config.ts`.

Tokens are **semantic, not a numeric scale**:

- Surfaces: `page` / `panel` / `panel-alt` / `line`
- Text: `ink` / `ink-muted` / `ink-faint`
- Accent (teal): `accent` / `accent-focus` / `accent-soft` / `accent-content`
- Other: `ochre` / `success` / `danger` / `link` / `tooltip`

Never reintroduce `surface-1..6`. **Light only** — no dark palette, no `.dark`, no `darkMode` setting; all three were removed deliberately.

## Fonts

Self-hosted in `public/font/`, registered in `fonts.css`:

- Inter → `font-sans`
- Oswald → `font-display`, variable 200–700, split latin / latin-ext by `unicode-range`. `h1` / `h2` take `font-display` globally.
- `font-mono` → system stack, no file. Carries every uppercase micro-label (`.label`) and every count.

## Where shared classes live

- `.label` → `global.css` (popup and options both use it).
- `.facts`, `.rule`, `.tool` → `popup.css`, which **only the popup entry imports**. Anything options needs goes in `global.css`.
