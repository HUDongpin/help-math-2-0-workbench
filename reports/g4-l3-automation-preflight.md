# G4 L3 Complete-Lesson Automation Preflight

> Acceptance-neutral inventory only. This report does not scaffold migrations, change status, accept evidence, or establish Flash/JavaScript parity or completion.

## Scope

- Release: `lesson-g04-l03-negative-numbers` — Negative Numbers
- Canonical scope: 40 (39 active XML pages + 1 shell)
- Sources: 29 FLA+SWF; 11 SWF-only
- Existing work: 40 migration workspace; 40 declared renderer
- Audio inventory: 143 unique MP3 (60 en, 83 es)
- Machine behavior triage: 38/40 items have interaction, random, external-call, or shell signals

## Parallel shard scaffold gates

| Batch | Items | Gate | Prerequisite | Admitted | Reason |
|---|---:|---|---|---:|---|
| batch-001 | 25 | OPEN | none (parallel shard) | 0/0 | this parallel development shard has no strict-completion prerequisite and the completion ledger is current |
| batch-002 | 15 | OPEN | none (parallel shard) | 0/0 | this parallel development shard has no strict-completion prerequisite and the completion ledger is current |

Both shard scaffold gates are open. Renderer implementation remains unauthorized, and `atomic` lesson publication remains outside this preflight until all 40 release members satisfy strict completion.

## Canonical items

Complexity signals: `I` interaction, `R` random, `X` external-call candidate. They are machine triage, not behavior proof.

| # | Batch | Canonical ID | Section/page | Source | Stage / FPS / root frames | Audio (exact/shared; en/es) | AS scripts | Risk | Reuse lead | Existing |
|---:|---|---|---|---|---|---|---:|---|---|---|
| 1 | batch-001 | `course-g04-l03-ir-001-341242cc` | IR/1 | fla+swf | 800×600 / 12 / 10 | 0/0; 0/0 | AS1/2 (20) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 2 | batch-001 | `course-g04-l03-rw-002` | RW/2 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (6) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 3 | batch-001 | `course-g04-l03-rw-003` | RW/3 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (4) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 4 | batch-001 | `course-g04-l03-rw-004` | RW/4 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (5) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 5 | batch-001 | `course-g04-l03-vb-002` | VB/2 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (8) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 6 | batch-001 | `course-g04-l03-vb-003` | VB/3 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (32) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 7 | batch-001 | `course-g04-l03-vb-004` | VB/4 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (5) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 8 | batch-001 | `course-g04-l03-vb-005` | VB/5 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (5) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 9 | batch-001 | `course-g04-l03-vb-006` | VB/6 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (6) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 10 | batch-001 | `course-g04-l03-vb-007` | VB/7 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (43) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 11 | batch-001 | `course-g04-l03-vb-008` | VB/8 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (43) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 12 | batch-001 | `course-g04-l03-vb-009` | VB/9 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (6) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 13 | batch-001 | `course-g04-l03-in-002` | IN/2 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (8) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 14 | batch-001 | `course-g04-l03-in-003` | IN/3 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (2) | low — | `course-g04-l03-in-009` | preserved; renderer |
| 15 | batch-001 | `course-g04-l03-in-004` | IN/4 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (56) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 16 | batch-001 | `course-g04-l03-in-005` | IN/5 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (37) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 17 | batch-001 | `course-g04-l03-in-006` | IN/6 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (47) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 18 | batch-001 | `course-g04-l03-in-007` | IN/7 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (6) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 19 | batch-001 | `course-g04-l03-in-008` | IN/8 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (19) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 20 | batch-001 | `course-g04-l03-in-009` | IN/9 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (5) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 21 | batch-001 | `course-g04-l03-in-010` | IN/10 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (31) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 22 | batch-001 | `course-g04-l03-in-011` | IN/11 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (4) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 23 | batch-001 | `course-g04-l03-in-012` | IN/12 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (50) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 24 | batch-001 | `course-g04-l03-ti-002` | TI/2 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (87) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 25 | batch-001 | `course-g04-l03-ti-003` | TI/3 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (50) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 26 | batch-002 | `course-g04-l03-ti-004` | TI/4 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (80) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 27 | batch-002 | `course-g04-l03-ti-005` | TI/5 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (41) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 28 | batch-002 | `course-g04-l03-ti-006` | TI/6 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (69) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 29 | batch-002 | `course-g04-l03-gs-002` | GS/2 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (39) | high IR | `course-g04-l03-in-009` | preserved; renderer |
| 30 | batch-002 | `course-g04-l03-ts-002` | TS/2 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (6) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 31 | batch-002 | `course-g04-l03-ts-003` | TS/3 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (5) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 32 | batch-002 | `course-g04-l03-ts-004` | TS/4 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (13) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 33 | batch-002 | `course-g04-l03-ts-005` | TS/5 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (12) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 34 | batch-002 | `course-g04-l03-ts-006` | TS/6 | fla+swf | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (3) | low — | `course-g04-l03-in-009` | preserved; renderer |
| 35 | batch-002 | `course-g04-l03-ts-007` | TS/7 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (89) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 36 | batch-002 | `course-g04-l03-ts-008` | TS/8 | swf-only | 800×600 / 12 / 10 | 1/0; 0/1 | AS1/2 (83) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 37 | batch-002 | `course-g04-l03-fq-001` | FQ/1 | fla+swf | 800×600 / 12 / 10 | 0/108; 60/48 | AS1/2 (14) | medium I | `course-g04-l03-in-009` | preserved; renderer |
| 38 | batch-002 | `course-g04-l03-fq-002` | FQ/2 | fla+swf | 800×600 / 12 / 10 | 0/108; 60/48 | AS1/2 (121) | high IRX | `course-g04-l03-in-009` | preserved; renderer |
| 39 | batch-002 | `course-g04-l03-fq-003` | FQ/3 | fla+swf | 800×600 / 12 / 10 | 0/108; 60/48 | AS1/2 (121) | high IX | `course-g04-l03-in-009` | preserved; renderer |
| 40 | batch-002 | `shell-course-g04-l03-index-local` | shell | swf-only | 800×600 / 12 / 50 | 0/0; 0/0 | AS1/2 (528) | high IRX | `course-g04-l03-in-009` | preserved; renderer |

## Acceptance boundary and blockers

- `workspace-not-scaffolded-by-design`: No migration workspace exists yet; the open parallel-shard scaffold gate does not itself create one.
- `paired-fla-missing`: No paired FLA is present, so authoring-timeline, library, script, font, and symbol confidence is reduced.
- `source-audit-incomplete`: This machine triage is not the required FFDec/swfmill/Animate/runtime source audit.
- `authoritative-baseline-pending`: An authorized original-runtime baseline and reachable scenario traversal are not established by this report.
- `audio-cue-mapping-or-acceptance-pending`: Catalog audio association does not prove cue reachability, timing, bilingual listening quality, or acceptance.
- `visual-behavior-human-owner-gates-pending`: Full-frame RMSE, behavior, product QA, engineering, strict human, and owner gates remain separate and pending.
- `existing-js-is-non-authoritative`: The existing JavaScript implementation is reusable engineering work only; it is not original-runtime parity or strict completion.

Source bindings and all 40 item-level blocker-code lists are in `reports/g4-l3-automation-preflight.json`.
