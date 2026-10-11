---
paths:
  - "src/core/**"
  - "src/background/**"
---

# Known rough edges

- `settings.init()` has a `loaded` re-entrancy guard resolving to `{} as Settings` after first run; `sessions.load`'s comment notes an unresolved Firefox/Chrome inconsistency.
- `compress.ts` returns `undefined` on Chromium by design — all call sites must optional-chain.
- `sessions.put()` fails loud (`log.error`) when the target id is not in the store. Mutate store contents only through the store API, never by editing list items in place.
