# Historical Office Documents deduplication

Completed: `2026-07-25T13:15:18.197472+08:00`

- Removed: **38 files** from **26 exact-hash groups**.
- Verified logical bytes removed: **115,915,956 bytes**.
- Kept one byte-identical file for every removed group and reverified its SHA-256.
- Removed no directories.
- Protected: **28 path-dependent groups**, **72 extra paths**, **5,079,411 bytes**.
- Deletion was permanent. The CSV/JSON manifests record paths and hashes but are not content backups.

Files:

- `reviewed-files.csv`: each retained and deleted path, hash, size, and keep path.
- `protected-duplicates.csv`: technical duplicate paths intentionally retained.
- `dedupe-plan.json`: frozen pre-delete totals and safety decision.
- `dedupe-result.json`: verified post-delete totals.
