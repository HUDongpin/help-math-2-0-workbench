# Source Intake And Identity

Use this reference before scaffolding or importing a source. Preserve provenance and placement identity before interpreting animation behavior.

## Resolve The Canonical Source

1. Read the repository catalogs before searching broad external archives.
2. Match candidate technical assets by SHA-256, not filename.
3. Keep original FLA and shipped SWF together when both exist.
4. Copy only reviewed owner-provided sources into `source-assets/flash/`, then record their byte count, SHA-256, original location, custody, and date.
5. Never edit, recompress, optimize, repair, resave, or overwrite a preserved source.

An exact hash match proves byte identity only. It does not prove authoring lineage, runtime fidelity, acceptance, or release readiness.

## Separate Asset And Placement Identity

- Set `assetId` to `swf-<full-lowercase-sha256>` for a preserved shipped SWF.
- Give every source placement a stable `animationId`, even when multiple placements share identical bytes.
- Search existing migration manifests by canonical `animationId`, `assetId`, and placement path before scaffolding. Reuse the matching canonical workspace; never create a second workspace named from a source filename or alias.
- Record `placementPath`, catalog evidence, title/classification evidence, and any `aliasOf` or `variantOf` relationship.
- Never collapse placements solely because names or hashes match; instructional context, host behavior, language, or surrounding audio may differ.
- Record unresolved conflicts instead of inventing a canonical placement.

## Use Private Archives Safely

The historical Office archive, HELP Math 1.0 SQL archive, and canonical `source-assets/` collection are separate evidence sources.

- Before importing from the historical Office archive, read its README, claim ledger, and technical-source crosswalk in the order required by project `AGENTS.md`.
- Before using SQL-derived information, read the privacy-safe repository catalogs first. Treat database SWF references as paths, not embedded binaries.
- Keep private archive paths, raw records, personal data, credentials, and confidential business content out of Git, deployments, fixtures, logs, screenshots, and shareable prompts or reports.
- Inspect the smallest necessary source and emit only aggregate or redacted findings.
- Never modify an external archive while cataloging or matching it.

## Intake Stop Conditions

Stop and report the limitation when:

- A claimed source cannot be hash-bound to a preserved file.
- Only an FLA exists and the shipped SWF is unavailable.
- A source placement, alias, or variant relationship is unresolved.
- A required external dependency, host SWF, font, audio file, or localization asset is missing.
- Importing the candidate would expose restricted data or violate archive custody.

Keep the migration in a non-complete state until the missing evidence is recovered or an explicitly scoped exception is supported by the validator and accepted through the proper review path.

An exception can document a validator-supported, bounded mismatch; it cannot replace a preserved shipped SWF, mandatory original-runtime/full-frame or natural-trace evidence, required audio acceptance, named human review, owner acceptance, strict validation, or an atomic release gate.
