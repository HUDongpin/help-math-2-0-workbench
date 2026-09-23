# G4 L10 VB003 static specification candidate v1 review input

Status: `review-input-frozen-no-review-verdict`

This is a frozen, acceptance-neutral review input. It is not a review verdict, adopter, specification acceptance, helper implementation, runtime baseline, renderer, or release decision.

## Exact closure

- Review-universe files: 8
- Review-universe bytes: 160935
- Review-universe set SHA-256: `1ba9ce666fc30f7ef490b9befe2072e9581bc74a50343fd70fcf9a2eaef3baf7`
- Chunk count: 58
- Maximum chunk bytes: 3072
- Chunk-set SHA-256: `02d38847a1b9382619ae480b43b42baad13c005ebcc3da8ec43be207bdab2f6c`
- Xattr-set SHA-256: `abe4ce4561ef1b3b273722dbc8fbb65e27050e4400bb546afbce17a4e3999bf4`
- Review-input fingerprint SHA-256: `98eb757b566173d92e4a739557cadfd69150e9d884aed33bc2fc4b8538827811`

## Inputs

| Role | Path | Bytes | SHA-256 | Mode | Chunks | Max chunk |
|---|---|---:|---|---:|---:|---:|
| `source-plan` | `reports/g4-l10-vb003-static-specification-gap-closure-v1.json` | 43111 | `7150708ad2686e95b058b1a3400fc20563779bc6d9b2114378d6f0c321a62f65` | `0644` | 15 | 3072 |
| `candidate-package-builder` | `scripts/build-g4-l10-vb003-static-specification-candidate-package-v1.mjs` | 28603 | `0154c24adac6a03e5f1c79909a399dc4cab88e279d1e35cd1a1b0da025caa265` | `0644` | 10 | 3071 |
| `candidate-package-builder-test` | `scripts/build-g4-l10-vb003-static-specification-candidate-package-v1.test.mjs` | 6533 | `9edd0e6ae7b897383ae0234e8b0a2cd81fc8a85e947652062151da2b58454d8f` | `0644` | 3 | 3060 |
| `candidate-brief` | `migrations/course-g04-l10-vb-003/audit/vb003-static-specification-candidate-v1/MIGRATION_BRIEF.candidate.md` | 19780 | `40e684f0e373875bc2e5e85ebad62dae8c873f7427ec9d998c80fc8cf1d24c27` | `0444` | 7 | 3058 |
| `candidate-receipt` | `migrations/course-g04-l10-vb-003/audit/vb003-static-specification-candidate-v1/candidate-receipt.json` | 4300 | `389299f633cdbcfff3317396ba9a059978308d1538931216ee51a67f58c73a26` | `0444` | 2 | 3040 |
| `candidate-migration` | `migrations/course-g04-l10-vb-003/audit/vb003-static-specification-candidate-v1/migration.candidate.json` | 12195 | `3460532e5f2ff4c4b1d2fd5a6e8e2fc37188fcc186cca704c6701440a92dc5a1` | `0444` | 5 | 3059 |
| `candidate-nested-keyframes` | `migrations/course-g04-l10-vb-003/audit/vb003-static-specification-candidate-v1/nested-structural-keyframes.candidate.csv` | 5594 | `99b123ab80b4cd487e04973a0d9833d87dbefe65936540cc7276a26800686c24` | `0444` | 2 | 2949 |
| `candidate-definition-inventory` | `migrations/course-g04-l10-vb-003/audit/vb003-static-specification-candidate-v1/swf-definition-inventory.candidate.csv` | 40819 | `63eb03f9398a708d59950dba0d0b51ceaa9fdb645b5c616162896d34cb90ccb1` | `0444` | 14 | 3065 |

The complete per-file stat, xattr and line-chunk manifests are in the JSON companion. A reviewer must extract one declared native `sed -n` line range at a time, verify its bytes/LF/SHA-256, and reconstruct every file in explicit order without emitting an aggregate to the terminal.

## Review scopes

- **schema:** validate JSON/CSV/Markdown syntax and internal cross-references; compare every candidate change with the exact source plan and canonical preimages; validate all 120 definition rows and 12 evidence-empty nested keyframe rows.
- **adversarial:** attack symlink, race, no-clobber, partial-custody and tamper paths; verify unsupported apply/recover/write/force modes remain rejected; attack xattr policy, input mixing, candidate/adopter confusion and authority escalation.
- **whole:** read every byte of all eight inputs through the bounded chunk transport; reconcile goal alignment and candidate-versus-adopter boundaries; confirm no runtime, baseline, renderer, acceptance, batch, integration or publication authority.

## Closed authority

No reviewer task is authorized or created by this artifact. Every authority and acceptance effect is false. A future independent review and a separate guarded adopter would both be required before any canonical VB003 specification file could change.
