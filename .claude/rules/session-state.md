---
paths:
  - "src/core/state/**"
  - "src/core/types/**"
  - "src/core/utils/database.ts"
  - "src/core/utils/serialize.ts"
  - "src/core/utils/saveSession.ts"
  - "src/core/utils/getSession.ts"
  - "src/background/**"
---

# Session state

Stores (`src/core/state/`) are IIFE singletons exposing a curated API, not raw writables.

## Writes queue

Every `sessions` mutation — `add`, `addBackup`, `put`, `remove`, `removeAll`, `removeTab` — goes through one FIFO queue (`createSerializer`, `src/core/utils/serialize.ts`); background holds a second instance for its alarm and context-menu handlers.

- Queued, never dropped: `add` returning `undefined` means the save failed, never that it was skipped.
- `busy` is true from enqueue until the queue drains.
- New mutation → add it to the queue, not beside it.
- Internal callers (`put` → `remove`, `deleteTab` → `put`) use the raw functions — a queued call from inside a queued slot deadlocks.

Queues are per-context and cannot serialise a background save against a popup save, which share the `lastSaved` guard. `saveSession` therefore reads that guard **after** the tab read, narrowing the overlap to persist + claim. Narrowed, not closed — closing it needs popup saves routed through background.

## `currentSession`

Owned by `src/core/state/currentSession.ts`, not by a component.

- `createCurrentSessionReader(ports)` holds the tab/window listeners, the 50 ms debounce and the `getSession` call, taking every browser effect as an injected port so it is testable (`currentSession.test.ts`).
- `sessions.ts` wires the real ports and is the only place deciding **where** "current" is read — in every context that loads the store, options included.
- `load()` awaits `current.ready`, so `selectionId: "current"` resolves against a session actually read.
- `ready` settles after the first read **attempt**, failure included — gating it on success would leave `load()` pending and `loaded` false forever after one rejection.
- Failed read → `currentSession` is `undefined`. `sessions.add` and `sessions.select` guard for it, and so must any other reader of `get(currentSession)`.

## `filtered`

Derived store in an IIFE. `sessions.filter` cursor-scans and deserializes **every** record, so the last result is cached and reused when only `sortMethod` or `tagsFilter` changed.

- Identical filter options → the run came from `sessions`, not the filter UI → cache invalidated.
- A generation counter discards out-of-date in-flight queries.

## Two session shapes

Session lists hold **hundreds** of tabs; hydrated windows must never be resident in list context. The types enforce it:

- `SessionSummary` (`src/core/types/extension.ts`) — list shape. **No `windows` property.** `sites` is a `SiteCount[]` of top domains counted at save time, so a row shows a domain breakdown without holding windows.
- `Session extends SessionSummary` — hydrated, real `windows: BrowserWindow[]`. Held only by `sessions.selection` and `currentSession`.

Rules:

- `iterateSessions` and `filterSessions` return `SessionSummary[]` (windows dropped per record via `toSummary`).
- `sessionStore.hydrate(summary)` is the only route from a summary to windows; `sessions.selectById` uses it.
- `sessions` holds `SessionSummary[]`; `sessions.put()` takes a `Session` and writes back a `SessionSummary`.
- Any refactor that trusts a list item to have `windows` reintroduces the memory regression.

`iterateSessions` batches: the callback fires every `maxBatch` records (50 on initial load) so the UI paints progressively.
