---
paths:
  - "src/core/utils/backup/**"
---

# Import/export

Own formats only:

- `.tab` — 5-byte ASCII magic `TBTH1` + lz-string `decompressFromUint8Array`
- `.tab.json` — JSON envelope `{ tabitha: 1, sessions }` via `TextDecoder`

Both decode in `decodeSsf.ts`. Anything else is rejected with an error notification. `exportCompressed` picks `.tab` vs `.tab.json` on write.
