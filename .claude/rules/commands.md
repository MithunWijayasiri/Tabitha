---
paths:
  - "src/core/commands.ts"
  - "src/core/constants/keymap.ts"
  - "src/core/components/basic/Commands.svelte"
  - "src/core/components/basic/CommandPalette.svelte"
---

# Commands

Every action reachable by key, palette entry or session-row button is one row of `src/core/commands.ts`: `{ id?, title, hint?, palette, run }`. `id` is a `CommandId` from `keymap.ts`; keyed commands (`keyed()`) **derive** `title` and `hint` from that binding, never written twice. Unkeyed rows (e.g. delete, export) write their own `title` and have no `hint`. Rebinding a key is a one-file edit in `src/core/constants/keymap.ts`.

- `commands` derives over a `ports` store. `provideCommandPorts(partial)` registers a context's affordances (`promptTitle`, `focusSearch`, `reveal`, `visibleSessions`) and returns the `onMount` unregister. Ports are optional by design: the options page has no list and no search box, so `save` falls back to a timestamp title and `next`/`previous` no-op.
- `runCommand(id)` is the only entry point; it throws on an unbound id.
- `Commands.svelte` is the **single** `<svelte:window on:keydown>`, one per context, mounted by `popup.svelte` and `options.svelte`. It also renders the palette and the shared confirm modal from `paletteOpen` / `confirmRequest`.
- `Commands.svelte` drops `ev.repeat` — a held key would otherwise fire a queued session write once per auto-repeat.
- `CommandPalette.svelte` is presentational — filters on `palette: true`, renders `hint`.

Never hand-write a palette hint.
