# Strict Completion And Lesson Release

Use this reference after implementation and evidence work. Migration completion and lesson publication are separate transactions.

## Close One Migration

1. Complete the migration manifest, inventories, coverage, evidence, checklist, human record, owner record, and known exceptions.
2. Run the strict validator without `--allow-draft`.
3. Rebuild generated receipts or reports only through their reviewed generators.
4. Run `npm run ledger:build` and `npm run ledger:check`.
5. Confirm the current manifest hash and strict result appear in `catalog/completion-ledger.json`.

A green build, deterministic renderer audit, current-JS approval, complete implementation captures, or owner preview does not make a migration strict complete.

## Release A Lesson Atomically

- Define the exact required active lesson-page placement set and the modern My
  Lesson host-integration contract in the reviewed lesson-release source. The
  preserved legacy Flash course-shell SWF is excluded from migration and
  release membership under the 2026-08-16 Owner decision in `AGENTS.md`.
- Require every included animation placement to be strict complete and hash-bound to the current completion ledger.
- Rebuild and check the lesson-release ledger with `npm run release-ledger:build` and `npm run release-ledger:check`.
- Treat an eligible `catalog/lesson-release-ledger.json` entry as the technical
  atomic-completeness witness for that exact release, not as sufficient
  authority to open public routes.
- Open learner-facing routes only after a current `EvidenceReceiptV1` is
  admitted by the externally anchored production trust adapter and binds
  accepted Controlled Preview, Staged, and Owner-promotion decisions.
- If one required page, page-dependent modern-host adapter, navigation trace,
  language, audio cue, review, or manifest binding is pending, keep the whole
  lesson unpublished.

Do not expose draft, discovered, current-JS-only, or stale-hash migrations in the public product library. Keep preview, internal status, and learner-facing release surfaces distinct.

The current application has no production trust adapter and is intentionally
hard-closed even if a future technical ledger reaches its exact member count.

## Recheck After Any Upstream Change

Rebuild and revalidate when source hashes, trace specs, frame domains, scenarios, languages, renderer/module/timeline code, runtime contracts, captures, metrics, audio, known exceptions, or review descriptors change.

Preserve protected reviewer records and append history. Never edit generated ledgers by hand or weaken a placement set to make a lesson appear releasable.
