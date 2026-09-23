# G4 L3 Static Machine Source Audits

> Acceptance-neutral, read-only source evidence. These audits do not open batch gates or establish original-runtime authority, visual/behavioral parity, bilingual audio acceptance, human/owner approval, or migration completion.

## Scope and reproducibility

- Scope: 40 canonical items (39 XML pages + 1 shell).
- Sources: 29 FLA+SWF and 11 SWF-only; every selected source hash was physically reverified.
- Root timelines: 440 frames at 12 FPS.
- Static sprite definitions: 1205; 859 are reachable through a static placement graph.
- Declared timeline frames: 20203 across all root/sprite definitions; 19315 in the static root-reachable graph.
- FFDec scripts: 1809 normalized files, each content-hashed; audit-set SHA-256 `ef3e3f2d6757778662d280d10a4b04f46da84f0bd402c9d6c41017f58da69709`.
- Audio: 143 catalog-associated MP3 files physically verified (60 en / 83 es). Cue timing and listening acceptance remain unestablished.

Static placement reachability is an implementation-planning fact only. Dynamic linkage, ActionScript state, shell hosting, and user actions can change actual runtime reachability; every migration still needs a reviewed frame-domain disposition and authoritative runtime traces.

## Per-item audit index

`Domains` is root frames / statically root-reachable sprite definitions / all sprite definitions / longest statically reachable domain. `Deps` counts distinct ActionScript API and SWF import candidates, not executed calls.

| # | Batch | Animation | Section/page | Source | Domains | AS files | Random | Deps | Embedded/catalog audio |
|---:|---|---|---|---|---|---:|---:|---:|---|
| 1 | batch-001 | `course-g04-l03-ir-001-341242cc` | IR/1 | fla+swf | 10 / 3/8 / 136 | 20 | 1 | 0 | 272 / 0 |
| 2 | batch-001 | `course-g04-l03-rw-002` | RW/2 | swf-only | 10 / 2/2 / 1289 | 6 | 0 | 0 | 1287 / 1 |
| 3 | batch-001 | `course-g04-l03-rw-003` | RW/3 | fla+swf | 10 / 2/2 / 278 | 4 | 0 | 0 | 272 / 1 |
| 4 | batch-001 | `course-g04-l03-rw-004` | RW/4 | swf-only | 10 / 3/3 / 442 | 5 | 0 | 0 | 438 / 1 |
| 5 | batch-001 | `course-g04-l03-vb-002` | VB/2 | fla+swf | 10 / 2/2 / 193 | 8 | 0 | 0 | 188 / 1 |
| 6 | batch-001 | `course-g04-l03-vb-003` | VB/3 | fla+swf | 10 / 17/19 / 160 | 32 | 0 | 0 | 199 / 1 |
| 7 | batch-001 | `course-g04-l03-vb-004` | VB/4 | fla+swf | 10 / 2/2 / 245 | 5 | 0 | 0 | 229 / 1 |
| 8 | batch-001 | `course-g04-l03-vb-005` | VB/5 | fla+swf | 10 / 2/2 / 180 | 5 | 0 | 0 | 175 / 1 |
| 9 | batch-001 | `course-g04-l03-vb-006` | VB/6 | fla+swf | 10 / 2/2 / 163 | 6 | 0 | 0 | 158 / 1 |
| 10 | batch-001 | `course-g04-l03-vb-007` | VB/7 | fla+swf | 10 / 16/17 / 69 | 43 | 0 | 0 | 318 / 1 |
| 11 | batch-001 | `course-g04-l03-vb-008` | VB/8 | fla+swf | 10 / 14/15 / 62 | 43 | 0 | 0 | 302 / 1 |
| 12 | batch-001 | `course-g04-l03-vb-009` | VB/9 | fla+swf | 10 / 2/2 / 175 | 6 | 0 | 0 | 141 / 1 |
| 13 | batch-001 | `course-g04-l03-in-002` | IN/2 | swf-only | 10 / 2/2 / 492 | 8 | 0 | 0 | 487 / 1 |
| 14 | batch-001 | `course-g04-l03-in-003` | IN/3 | fla+swf | 10 / 2/2 / 472 | 2 | 0 | 0 | 443 / 1 |
| 15 | batch-001 | `course-g04-l03-in-004` | IN/4 | fla+swf | 10 / 23/24 / 169 | 56 | 1 | 0 | 417 / 1 |
| 16 | batch-001 | `course-g04-l03-in-005` | IN/5 | fla+swf | 10 / 19/20 / 186 | 37 | 0 | 0 | 210 / 1 |
| 17 | batch-001 | `course-g04-l03-in-006` | IN/6 | fla+swf | 10 / 13/15 / 1057 | 47 | 3 | 0 | 1141 / 1 |
| 18 | batch-001 | `course-g04-l03-in-007` | IN/7 | swf-only | 10 / 2/2 / 555 | 6 | 0 | 0 | 556 / 1 |
| 19 | batch-001 | `course-g04-l03-in-008` | IN/8 | fla+swf | 10 / 5/6 / 217 | 19 | 2 | 0 | 297 / 1 |
| 20 | batch-001 | `course-g04-l03-in-009` | IN/9 | swf-only | 10 / 5/5 / 637 | 5 | 0 | 0 | 589 / 1 |
| 21 | batch-001 | `course-g04-l03-in-010` | IN/10 | fla+swf | 10 / 18/19 / 264 | 31 | 0 | 0 | 330 / 1 |
| 22 | batch-001 | `course-g04-l03-in-011` | IN/11 | swf-only | 10 / 2/2 / 441 | 4 | 0 | 0 | 440 / 1 |
| 23 | batch-001 | `course-g04-l03-in-012` | IN/12 | fla+swf | 10 / 23/24 / 215 | 50 | 0 | 0 | 389 / 1 |
| 24 | batch-001 | `course-g04-l03-ti-002` | TI/2 | fla+swf | 10 / 34/38 / 254 | 87 | 1 | 0 | 446 / 1 |
| 25 | batch-001 | `course-g04-l03-ti-003` | TI/3 | fla+swf | 10 / 20/22 / 140 | 50 | 1 | 0 | 122 / 1 |
| 26 | batch-002 | `course-g04-l03-ti-004` | TI/4 | fla+swf | 10 / 25/97 / 125 | 80 | 1 | 0 | 254 / 1 |
| 27 | batch-002 | `course-g04-l03-ti-005` | TI/5 | fla+swf | 10 / 7/79 / 210 | 41 | 2 | 0 | 298 / 1 |
| 28 | batch-002 | `course-g04-l03-ti-006` | TI/6 | fla+swf | 10 / 19/91 / 167 | 69 | 1 | 0 | 296 / 1 |
| 29 | batch-002 | `course-g04-l03-gs-002` | GS/2 | fla+swf | 10 / 16/19 / 428 | 39 | 1 | 0 | 661 / 1 |
| 30 | batch-002 | `course-g04-l03-ts-002` | TS/2 | fla+swf | 10 / 2/2 / 355 | 6 | 0 | 0 | 356 / 1 |
| 31 | batch-002 | `course-g04-l03-ts-003` | TS/3 | swf-only | 10 / 2/2 / 241 | 5 | 0 | 0 | 237 / 1 |
| 32 | batch-002 | `course-g04-l03-ts-004` | TS/4 | swf-only | 10 / 2/2 / 336 | 13 | 0 | 0 | 332 / 1 |
| 33 | batch-002 | `course-g04-l03-ts-005` | TS/5 | fla+swf | 10 / 2/2 / 275 | 12 | 0 | 0 | 276 / 1 |
| 34 | batch-002 | `course-g04-l03-ts-006` | TS/6 | fla+swf | 10 / 2/2 / 128 | 3 | 0 | 0 | 129 / 1 |
| 35 | batch-002 | `course-g04-l03-ts-007` | TS/7 | swf-only | 10 / 22/23 / 696 | 89 | 0 | 0 | 1016 / 1 |
| 36 | batch-002 | `course-g04-l03-ts-008` | TS/8 | swf-only | 10 / 20/21 / 789 | 83 | 0 | 0 | 1094 / 1 |
| 37 | batch-002 | `course-g04-l03-fq-001` | FQ/1 | fla+swf | 10 / 2/7 / 52 | 14 | 0 | 0 | 0 / 108 |
| 38 | batch-002 | `course-g04-l03-fq-002` | FQ/2 | fla+swf | 10 / 207/207 / 68 | 121 | 1 | 1 | 0 / 108 |
| 39 | batch-002 | `course-g04-l03-fq-003` | FQ/3 | fla+swf | 10 / 207/207 / 68 | 121 | 0 | 1 | 0 / 108 |
| 40 | batch-002 | `shell-course-g04-l03-index-local` | shell | swf-only | 50 / 89/187 / 871 | 528 | 3 | 6 | 283 / 0 |

## Acceptance boundary

This is a deterministic static machine source audit only. It does not open batch gates or prove runtime reachability, authoritative baseline, RMSE, behavior, bilingual audio acceptance, human/owner review, parity, or completion.

The JSON report retains every static frame-domain record, placement edge, script-file SHA-256, signal evidence file, embedded-sound fact, import/linkage fact, external-API candidate, catalog audio association, and per-item audit fingerprint.
