---
paths:
  - "tools/**"
  - "vite.config*.ts"
  - "package.json"
---

# Manifest, permissions, store review

Pipeline detail lives in `docs/BUILD.md`; this file is store/policy constraints.

- Least privilege. Permissions come only from `extension.permissions(firefox)` in `tools/constants.ts`. New permission → prove no existing one covers it; non-core feature → `optional_permissions` + runtime request.
- Adding a permission that carries a new install warning makes Chromium disable the extension on update until the user re-approves. Treat any permission addition as a breaking release.
- No remotely hosted or dynamically evaluated code: everything bundled, no `eval` / `new Function` / remote `<script>`. Both stores reject it.
- The loosened `content_security_policy` is dev-only (`buildManifest.ts`, `if (dev)`). Prod manifest must carry none.
- Firefox `strict_min_version` is `140.0`. Using an API or manifest key newer than that → bump it.
- AMO accepts minified (terser) output but requires the pre-build source plus reproducible build steps: `npm ci` + `npm run build:ff` from a clean checkout must produce the shipped files. Dependencies only from npm, pinned by `package-lock.json`; no build step that downloads anything else.
- Never ship obfuscated code — AMO forbids it; minification only.
