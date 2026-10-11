---
paths:
  - "src/core/utils/storage.ts"
  - "src/core/utils/database.ts"
  - "src/core/state/settings.ts"
  - "src/core/types/extension.ts"
---

# Persisted data compatibility

Stored data outlives the code that wrote it. Users upgrade from any earlier version, skipping versions in between.

## Settings (`browser.storage.local`, `tabitha.*`)

- New key → add a default in the `settings` IIFE; reads fall back to it (`getStorage` / `getStorageItem` take defaults). No migration needed.
- Renamed or retyped key → migrate in background `onInstalled` (`reason === "update"`): read old, write new, remove old. Never just change the type and hope.
- Removed key → delete it in the same migration; leftovers persist forever otherwise.

## Sessions (IndexedDB `tabitha`)

- Any change to the stored record shape or indexes → bump DB version + a new branch in `SessionStore.upgradeSessions`. Current: 1→2 (`tags` → `tag`, index swapped), →3 (backfills `sites` via `countSites`).
- `upgradeSessions` is passed as a bare callback (`upgrade: this.upgradeSessions`), so it must never touch `this`.
- Branches run cumulatively from the user's old version — each must work on data left by every earlier branch.
