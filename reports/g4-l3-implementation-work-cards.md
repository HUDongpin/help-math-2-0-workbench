# G4 L3 Deterministic Implementation Work Cards

> Acceptance-neutral pre-implementation specification for the 39 active XML pages plus the course shell. Every renderer choice is provisional and every strict evidence gate remains unresolved.

## Bound source evidence

- Machine source audit: `reports/g4-l3-machine-source-audits.json` / `c7f987904de8e2a5bca907931feedab0e3bd61ffdcf26b56ef5d7295e49ab9f6`
- Catalog batches: `catalog/batches.json` / `758c6a9197083a9b85d86241e88a190d3b081d0aef5319337ab792df6063b292`
- Physical lesson XML: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index.xml` / `0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0`; 39 active pages and 6 commented historical Page references.
- Audio groups: `catalog/audio-groups.json` / `5f6223d763f5ffdeb476e42f747655b677ac40a16a16361344c05e5572924aed`
- Animate prepare-only readiness: `reports/g4-l3-animate-prepare-readiness.json` / `d8aa91cd0a7c304f83930dfc34e7b63c714bf5c395022c192bc4c39251382982`; 29 read-only copies ready, current unattended blank JSFL probe **not ready**.

Static script, placement, and tag evidence identifies work candidates only. It does not prove runtime reachability, scenario completeness, visual behavior, audio timing, or a final renderer choice.

## Parallel shard scaffold boundary

- **batch-001 / shard-01**: 25 cards, release part 1/2; scaffold gate **open**; development prerequisites: none.
  Entry rule: this parallel development shard has no strict-completion prerequisite and the completion ledger is current
- **batch-002 / shard-02**: 15 cards, release part 2/2; scaffold gate **open**; development prerequisites: none.
  Entry rule: this parallel development shard has no strict-completion prerequisite and the completion ledger is current

Both parallel-shard scaffold gates are open, but renderer implementation is authorized now for **0** batches. Publication mode is **atomic** and this report authorizes no publication.
Catalog-backed migration workspaces now exist for **40/40** cards; workspace presence remains distinct from implementation, fidelity, acceptance, and strict completion.

## Work-card summary

- 40 cards: 39 pages + 1 shell; 29 FLA-backed + 11 SWF-only; 440 root frames at 12 FPS.
- Static candidates: interaction 38, random 12, external 3, embedded audio 37.
- Catalog-associated audio: 143 unique hash-verified files; cue mapping and listening acceptance remain false.
- Provisional renderer mix: react-state-machine+canvas: 38; react-svg: 2. Confidence never exceeds medium-low.
- Every FLA+SWF card points to the paired-source `--paired-swf` / `--paired-swf-sha256` prepare-only mode. A full audit still requires a named human to acknowledge only the legacy conversion popup; dialog automation is forbidden.
- Frame-domain, scenario, and original-runtime work remains unresolved on 40/40, 40/40, and 40/40 cards respectively.

## Ordered cards

| # | Batch/order | Animation | XML location | Source | Stage / FPS / root frames | Static signals | Provisional renderer | Required unresolved work |
|---:|---|---|---|---|---|---|---|---|
| 1 | batch-001/1 | `course-g04-l03-ir-001-341242cc` | IR/1 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:272 | react-state-machine+canvas (low) | 4 static domain candidates; 8 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 2 | batch-001/2 | `course-g04-l03-rw-002` | RW/2 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:1287, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 3 | batch-001/3 | `course-g04-l03-rw-003` | RW/3 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:272, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 4 | batch-001/4 | `course-g04-l03-rw-004` | RW/4 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:438, catalog-audio:1 | react-state-machine+canvas (low) | 4 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 5 | batch-001/5 | `course-g04-l03-vb-002` | VB/2 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:188, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 6 | batch-001/6 | `course-g04-l03-vb-003` | VB/3 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:199, catalog-audio:1 | react-state-machine+canvas (low) | 18 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 7 | batch-001/7 | `course-g04-l03-vb-004` | VB/4 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:229, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 8 | batch-001/8 | `course-g04-l03-vb-005` | VB/5 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:175, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 9 | batch-001/9 | `course-g04-l03-vb-006` | VB/6 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:158, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 10 | batch-001/10 | `course-g04-l03-vb-007` | VB/7 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:318, catalog-audio:1 | react-state-machine+canvas (low) | 17 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 11 | batch-001/11 | `course-g04-l03-vb-008` | VB/8 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:302, catalog-audio:1 | react-state-machine+canvas (low) | 15 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 12 | batch-001/12 | `course-g04-l03-vb-009` | VB/9 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:141, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 13 | batch-001/13 | `course-g04-l03-in-002` | IN/2 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:487, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 14 | batch-001/14 | `course-g04-l03-in-003` | IN/3 | fla+swf | 800×600 / 12 / 10 | embedded-audio:443, catalog-audio:1 | react-svg (medium-low) | 3 static domain candidates; 4 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 15 | batch-001/15 | `course-g04-l03-in-004` | IN/4 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:417, catalog-audio:1 | react-state-machine+canvas (low) | 24 static domain candidates; 6 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 16 | batch-001/16 | `course-g04-l03-in-005` | IN/5 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:210, catalog-audio:1 | react-state-machine+canvas (low) | 20 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 17 | batch-001/17 | `course-g04-l03-in-006` | IN/6 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:1141, catalog-audio:1 | react-state-machine+canvas (low) | 14 static domain candidates; 6 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 18 | batch-001/18 | `course-g04-l03-in-007` | IN/7 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:556, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 19 | batch-001/19 | `course-g04-l03-in-008` | IN/8 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:297, catalog-audio:1 | react-state-machine+canvas (low) | 6 static domain candidates; 7 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 20 | batch-001/20 | `course-g04-l03-in-009` | IN/9 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:589, catalog-audio:1 | react-state-machine+canvas (low) | 6 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 21 | batch-001/21 | `course-g04-l03-in-010` | IN/10 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:330, catalog-audio:1 | react-state-machine+canvas (low) | 19 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 22 | batch-001/22 | `course-g04-l03-in-011` | IN/11 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:440, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 23 | batch-001/23 | `course-g04-l03-in-012` | IN/12 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:389, catalog-audio:1 | react-state-machine+canvas (low) | 24 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 24 | batch-001/24 | `course-g04-l03-ti-002` | TI/2 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:446, catalog-audio:1 | react-state-machine+canvas (low) | 35 static domain candidates; 6 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 25 | batch-001/25 | `course-g04-l03-ti-003` | TI/3 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:122, catalog-audio:1 | react-state-machine+canvas (low) | 21 static domain candidates; 6 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 26 | batch-002/1 | `course-g04-l03-ti-004` | TI/4 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:254, catalog-audio:1 | react-state-machine+canvas (low) | 26 static domain candidates; 8 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 27 | batch-002/2 | `course-g04-l03-ti-005` | TI/5 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:298, catalog-audio:1 | react-state-machine+canvas (low) | 8 static domain candidates; 8 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 28 | batch-002/3 | `course-g04-l03-ti-006` | TI/6 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:296, catalog-audio:1 | react-state-machine+canvas (low) | 20 static domain candidates; 8 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 29 | batch-002/4 | `course-g04-l03-gs-002` | GS/2 | fla+swf | 800×600 / 12 / 10 | interaction, random, embedded-audio:661, catalog-audio:1 | react-state-machine+canvas (low) | 17 static domain candidates; 8 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 30 | batch-002/5 | `course-g04-l03-ts-002` | TS/2 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:356, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 31 | batch-002/6 | `course-g04-l03-ts-003` | TS/3 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:237, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 32 | batch-002/7 | `course-g04-l03-ts-004` | TS/4 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:332, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 33 | batch-002/8 | `course-g04-l03-ts-005` | TS/5 | fla+swf | 800×600 / 12 / 10 | interaction, embedded-audio:276, catalog-audio:1 | react-state-machine+canvas (low) | 3 static domain candidates; 5 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 34 | batch-002/9 | `course-g04-l03-ts-006` | TS/6 | fla+swf | 800×600 / 12 / 10 | embedded-audio:129, catalog-audio:1 | react-svg (medium-low) | 3 static domain candidates; 4 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 35 | batch-002/10 | `course-g04-l03-ts-007` | TS/7 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:1016, catalog-audio:1 | react-state-machine+canvas (low) | 23 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 36 | batch-002/11 | `course-g04-l03-ts-008` | TS/8 | swf-only | 800×600 / 12 / 10 | interaction, embedded-audio:1094, catalog-audio:1 | react-state-machine+canvas (low) | 21 static domain candidates; 5 scenario families; source-unavailable-swf-only; original runtime; audio/listening |
| 37 | batch-002/12 | `course-g04-l03-fq-001` | FQ/1 | fla+swf | 800×600 / 12 / 10 | interaction, catalog-audio:108 | react-state-machine+canvas (low) | 3 static domain candidates; 8 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 38 | batch-002/13 | `course-g04-l03-fq-002` | FQ/2 | fla+swf | 800×600 / 12 / 10 | interaction, random, external, catalog-audio:108 | react-state-machine+canvas (low) | 208 static domain candidates; 9 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 39 | batch-002/14 | `course-g04-l03-fq-003` | FQ/3 | fla+swf | 800×600 / 12 / 10 | interaction, external, catalog-audio:108 | react-state-machine+canvas (low) | 208 static domain candidates; 8 scenario families; pending-human-assisted-animate-audit; original runtime; audio/listening |
| 40 | batch-002/15 | `shell-course-g04-l03-index-local` | shell | swf-only | 800×600 / 12 / 50 | interaction, random, external, embedded-audio:283 | react-state-machine+canvas (low) | 90 static domain candidates; 11 scenario families; source-unavailable-swf-only; original runtime; audio/listening |

## Acceptance boundary

These are deterministic pre-implementation work cards only. The two parallel-shard scaffold gates are open for workspace creation, but this report does not scaffold a migration, authorize renderer implementation, publish the atomic lesson, prove runtime reachability, select a final renderer, establish a baseline/RMSE/audio result, record human or owner approval, or complete a migration.
