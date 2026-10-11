---
paths:
  - "src/options/**"
  - "src/core/components/options/**"
---

# Options page

`open_in_tab: true`. Five pages behind a hash router (`General` / `Tags` / `Backup` / `Shortcuts` / `About`).

- `Tab.svelte` reads `location.href.split("#")[1]`, default `general`.
- New page → a `<Tab>` plus a branch in `options.svelte`.
