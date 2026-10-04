---
version: alpha
name: Tabitha Poster
description: Landing page identity for the Tabitha browser extension. A 1950s advertising plate derived from assets/github-banner.png. Scope is docs/index.html only — the extension UI has its own token set in uno.config.ts.
colors:
  pine: "#2c7a6b"
  pine-deep: "#0e5d51"
  pine-dark: "#0a3f37"
  cream: "#f6e3be"
  cream-dim: "#dcc79f"
  paper: "#fbf6e9"
  paper-alt: "#f0ead7"
  tomato: "#cf4630"
  ink: "#101a17"
  ink-soft: "#4a5b55"
  ink-faint: "#7f8d87"
  mint: "#60cdb5"
  ochre: "#b8801e"
typography:
  wordmark:
    fontFamily: Lobster Two
    fontSize: clamp(62px, 12.5vw, 132px)
    fontWeight: "700"
    fontStyle: italic
    lineHeight: "0.92"
    letterSpacing: 0.005em
  display-xl:
    fontFamily: Oswald
    fontSize: clamp(28px, 4.4vw, 42px)
    fontWeight: "600"
    lineHeight: "1.06"
    letterSpacing: 0.005em
    textTransform: uppercase
  display-md:
    fontFamily: Oswald
    fontSize: 19px
    fontWeight: "500"
    letterSpacing: 0.05em
    textTransform: uppercase
  tagchip:
    fontFamily: Oswald
    fontSize: clamp(15px, 2.6vw, 24px)
    fontWeight: "600"
    letterSpacing: 0.13em
  eyebrow:
    fontFamily: Oswald
    fontSize: 13px
    fontWeight: "500"
    lineHeight: "1"
    letterSpacing: 0.22em
    textTransform: uppercase
  button:
    fontFamily: Oswald
    fontSize: 15px
    fontWeight: "500"
    letterSpacing: 0.09em
    textTransform: uppercase
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.55"
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.6"
  micro-label:
    fontFamily: ui-monospace
    fontSize: 10px
    fontWeight: "400"
    letterSpacing: 0.13em
    textTransform: uppercase
  code:
    fontFamily: ui-monospace
    fontSize: 13px
    fontWeight: "400"
    lineHeight: "1.7"
rounded:
  xs: 3px
  sm: 5px
  DEFAULT: 9px
  md: 10px
  lg: 12px
  xl: 14px
  full: 999px
spacing:
  unit: 4px
  container-max: 1120px
  gutter: 20px
  plate-padding-y: 44px
  plate-padding-x: 38px
  plate-gap: 78px
components:
  plate:
    backgroundColor: transparent
    borderWidth: 2.5px
    borderColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    boxShadow: 0 0 0 3px {colors.cream}, 0 0 0 5.5px {colors.ink}
    padding: "{spacing.plate-padding-y} {spacing.plate-padding-x}"
  plate-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  plate-deep:
    backgroundColor: "{colors.pine-deep}"
  wordmark:
    textColor: "{colors.paper}"
    typography: "{typography.wordmark}"
    textShadow: 3px 3px 0 {colors.ink}, 4px 4px 0 {colors.ink}, 7px 7px 0 rgba(207, 70, 48, 0.5)
  tagchip:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.tagchip}"
    borderWidth: 2.5px
    borderColor: "{colors.ink}"
    rounded: "{rounded.DEFAULT}"
    boxShadow: 4px 4px 0 rgba(10, 26, 23, 0.45)
    padding: 7px 20px 6px
  button:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    borderWidth: 2.5px
    borderColor: "{colors.ink}"
    rounded: "{rounded.DEFAULT}"
    boxShadow: 4px 4px 0 {colors.ink}
    padding: 12px 22px
  button-hover:
    transform: translate(2px, 2px)
    boxShadow: 2px 2px 0 {colors.ink}
  button-solid:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.paper}"
  button-disabled:
    backgroundColor: rgba(246, 227, 190, 0.14)
    textColor: "{colors.cream-dim}"
    borderColor: rgba(16, 26, 23, 0.55)
    cursor: not-allowed
  eyebrow:
    textColor: "{colors.mint}"
    typography: "{typography.eyebrow}"
  eyebrow-on-paper:
    textColor: "{colors.tomato}"
  device:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    borderWidth: 2.5px
    borderColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    boxShadow: 10px 10px 0 rgba(10, 26, 23, 0.4), 0 0 0 3px {colors.cream}
  session-row:
    borderColor: "{colors.paper-alt}"
    padding: 10px 0
  session-row-hover:
    backgroundColor: "{colors.paper-alt}"
  session-row-selected:
    backgroundColor: "#dfeae4"
  session-band:
    width: 5px
    rounded: 0 {rounded.xs} {rounded.xs} 0
  badge-disc:
    backgroundColor: "{colors.pine-deep}"
    textColor: "{colors.cream}"
    borderWidth: 3px
    borderColor: "{colors.cream}"
    rounded: "{rounded.full}"
    width: 92px
    height: 92px
  keycap:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.micro-label}"
    rounded: "{rounded.sm}"
    borderBottom: 2px solid rgba(10, 26, 23, 0.5)
    padding: 6px 7px
  code-block:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    typography: "{typography.code}"
    rounded: 8px
    padding: 14px 16px
  step-number:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    width: 34px
    height: 34px
---

## Brand & Style

The page is a 1950s magazine advertisement, derived directly from `assets/github-banner.png` — the project's existing banner art. That banner is the source of truth for the identity: pine-teal ground, halftone dots, cream paper, tomato accent, heavy black keylines, brush-script wordmark, four-point sparkles, and circular badge icons.

The organising idea: **the poster is the ad, the paper is the product.** Teal surfaces are marketing; cream paper surfaces are the software. This mirrors the extension's own `--page` ground against its `--panel` popup, so the page and the product read as one thing.

Audience is developers and heavy-tab users arriving from GitHub. The page has one job: explain what Tabitha does and get them to build it. The extension is at `0.1.0` in `ALPHA` mode with no store listing, and the page must stay honest about that.

## Colors

Sampled from the banner, reconciled with the extension's real tokens.

- **Pine `#2c7a6b`** — the page ground. The banner's teal.
- **Pine-deep `#0e5d51`** — plate fills and badge discs. This is the extension's own `--accent`, so it ties page to product.
- **Pine-dark `#0a3f37`** — the footer band and the halftone dots.
- **Cream `#f6e3be`** — poster ink: body copy on teal, keylines, chips, buttons.
- **Paper `#fbf6e9`** — product surfaces only. Any cream panel signals "this is the software."
- **Tomato `#cf4630`** — the banner's polka-dot red. One accent, used sparingly: primary CTA, eyebrows on paper, step numbers, the footer heart.
- **Ink `#101a17`** — every keyline and hard offset shadow. Near-black, never pure black.
- **Mint `#60cdb5`** — from `assets/logo-glyph.svg`. Eyebrows on teal, focus rings, checkmarks.
- **Ochre `#b8801e`** — the ALPHA warning badge and one tag band. The only warning colour.

Do not add a fifth hue. The palette is already wide; new colours dilute the banner match.

## Typography

Three families, each with one job.

- **Lobster Two**, bold italic — the wordmark and nothing else. It is the sign-painter script from the banner. Set with a stacked offset shadow (two ink layers, then a translucent tomato layer) to reproduce the banner's letterpress feel.
- **Oswald** — the condensed poster gothic. Every headline, eyebrow, section label, button, and badge title. Always uppercase, always with positive letter-spacing that widens as the type gets smaller: `0.005em` at display size up to `0.22em` on eyebrows.
- **Inter** — all running body copy. This is the face the extension itself ships, which is the reason it is here.

A system monospace stack (`ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas`) carries every micro-label, count, keycap, domain, and code block. It is loaded from no file. This mirrors the extension's `.facts` and `.label` classes, which also use a fontless system mono stack.

Never introduce a fourth webfont.

## Layout & Spacing

Single column, `1120px` max width, `20px` gutters. Every section is a **plate**: a bordered card sitting on the teal ground, stacked with `78px` between them. There is no multi-column page grid; two-column arrangements happen inside a plate and collapse to one column below `900px`.

Spacing is on a loose 4px unit but is not mechanically scaled — plates are padded `44px / 38px` at desktop, `34px / 22px` below 900px, `26px / 16px` below 520px.

Section order encodes the reading path and should not be reshuffled: hero → four badges → lazy restore → shortcuts → privacy → install → footer band. Each plate alternates ground (transparent teal, deep teal, or cream paper) so no two adjacent plates share a surface.

## Elevation & Depth

Depth is **printed**, not atmospheric. There are no blurs, no gradients-as-shadows, and no glassmorphism anywhere.

- **Level 1 — the ground.** Pine fill, plus a fixed halftone dot field (`radial-gradient` dots at `9px` pitch, masked to fade from the top-left) and a fixed SVG `feTurbulence` grain at `0.16` opacity. Both are `position: fixed`, `pointer-events: none`, and sit behind everything.
- **Level 2 — plates.** The banner's frame: `2.5px` ink border, then a `3px` cream ring and a `5.5px` ink ring via stacked `box-shadow`. This triple rule is the single most identifying element of the design. Reproduce it exactly.
- **Level 3 — objects on a plate.** Hard offset shadows with zero blur: `4px 4px 0` for buttons and chips, `10px 10px 0 rgba(10,26,23,.4)` for the popup replica. Buttons translate `2px 2px` on hover and shrink their shadow to match, so the object appears pressed.

Never use a soft or blurred shadow. Every shadow in this system has `0` blur radius.

## Shapes

Rounded, but modestly — mid-century sign shapes, not pill-shaped modern UI. Plates use `14px`, the popup replica `12px`, buttons and chips `9px`, small controls `5px`, the session tag rail `3px`. Fully round: the four badge discs, the install step numbers, the pills and the footer band.

The four-point sparkle (`M12 0c.9 6.2 4.9 10.2 11.1 11.1C16.9 12 12.9 16 12 22.2 11.1 16 7.1 12 .9 11.1 7.1 10.2 11.1 6.2 12 0Z`) is the recurring graphic mark, taken from the banner. Scatter it sparingly in the hero only.

All icons are hand-authored inline SVG on a `24 24` viewBox, `fill: none`, `stroke: currentColor`, `stroke-width: 1.6–1.9`, round caps and joins — matching the stroke style of `public/icons/*.svg` in the extension. No icon font, no icon CDN.

## Components

### The hero popup replica

The signature element. It is a hand-built HTML/CSS replica of the extension's actual popup, not a screenshot. It must stay faithful to `src/core/components/popup/`:

- 5px tag rail down the left of every session row (`Session.svelte`)
- The mono `.facts` row: `4 windows · 118 tabs · 2 hours ago · WORK`, with `·` separators at 50% opacity
- Search-match highlighting via `<mark>` on the accent fill
- The selected row tinted, the others tinted only on hover
- Four action icons — restore, rename, tag, delete — hidden at `opacity: 0` and revealed on row hover, reproducing `group-hover:flex`

Sample data must be plausible and internally consistent: counts in the header equal the sum of the rows, and the autosave row is titled and tagged `Autosave` because that is what `src/background/background.ts` actually writes.

### Plates and eyebrows

Every plate opens with an eyebrow — a short uppercase Oswald line in mint (on teal) or tomato (on paper) — then an uppercase Oswald `h2`. Eyebrows name something true about the content; they are not decoration.

### Buttons

Cream fill, ink keyline, hard offset shadow, uppercase Oswald with an inline SVG at 18px. The primary CTA is tomato-filled. Store-listing buttons are **disabled placeholders** carrying a `Soon` pill and `cursor: not-allowed` — they must not link anywhere until listings exist.

### Motion

One orchestrated hero load: session rows deal in left-to-right with 90ms stagger, then the tab column fades in. Plates lift `16px` on scroll via `IntersectionObserver`, once each. Sparkles twinkle on a slow loop. Row hover reveals the action icons.

Everything motion-related lives inside `@media (prefers-reduced-motion: no-preference)`. With JS off or `IntersectionObserver` missing, the script adds `.in` to all targets immediately, so the full page is visible.

## Do's and Don'ts

**Do**

- Keep the page a single self-contained `docs/index.html`. Inline all CSS and JS.
- Load only Google Fonts (Inter, Lobster Two, Oswald) over the network. Nothing else.
- Verify every factual claim against the source before shipping it. Shortcut counts come from `README.md`, palette commands from `CommandPalette.svelte`, permissions from `tools/constants.ts`, session naming from `src/background/background.ts`.
- Keep the ALPHA / export-before-update warning visible in the hero.
- Keep wide content (code blocks, the popup replica) in its own `overflow-x: auto` container so the body never scrolls sideways.
- Keep `:focus-visible` outlines, semantic landmarks, and `aria-label` on figure-like code blocks.

**Don't**

- Don't add gradients as decoration, glassmorphism, blurred shadows, or gradient text. Every shadow has zero blur.
- Don't use emoji as icons, or decorative emoji anywhere.
- Don't add a fourth webfont or a fifth palette hue.
- Don't replace the popup replica with a screenshot or a stock browser mockup.
- Don't add `01 / 02 / 03` markers to anything that is not a real sequence. The install steps are the only numbered list, because they are genuinely ordered.
- Don't invent statistics, testimonials, user counts, or a changelog. The project is pre-1.0 with no users.
- Don't link store listings, a roadmap, or docs pages that are not committed to the repo.
- Don't introduce an icon library, CSS framework, or JS CDN.
