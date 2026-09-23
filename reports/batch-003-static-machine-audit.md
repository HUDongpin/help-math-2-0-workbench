# Batch-003 acceptance-neutral static machine audit

> Static source intake/audit only. The batch gate remains closed; no migration, renderer, route, approval, ledger, protected pin, or source file is changed.

## Exact scope

- Catalog queue: `grade-3-active`, batch: `batch-003`.
- G3 L1 Place Value: **25 canonical assets / 26 placement paths**.
- This fixed-size batch is only part of the 74-page lesson; complete-lesson audit: **no**.
- Sections: IR 1, RW 4, VB 16, IN 3, TI 1.

## Gate and acceptance boundary

- Batch-003 gate: **closed**; prerequisite release `lesson-g04-l03-negative-numbers`: 0/40 admitted.
- Reason: release lesson-g04-l03-negative-numbers is incomplete (40 missing).
- Implementation authorizations: **0**; strict completions: **0**.
- Animate/Ruffle/original-runtime sessions: **0 / 0 / 0**.

## Verified machine evidence

- SWFs: 25/25 canonical and 26/26 placement paths physically re-hashed.
- FLA: 18 canonical FLA-backed, 7 SWF-only; 19 placement FLA paths physically re-hashed.
- Native SWF facts: CWS v6, 800×600, 12 FPS, 250 root frames total.
- FFDec normalized ActionScript exports: 629 files; temporary output removed: yes.
- Asset definitions: 3294; exact font facts: 127; exact text occurrences: 965.
- Embedded audio tags: DefineSound=0, SoundStreamHead=111, SoundStreamHead2=0, SoundStreamBlock=12314.
- Catalog audio: 24 files / 6419616 bytes, all physically re-hashed; catalog language is `und` for all 24.
- Exact asset reuse groups across SWFs: 89.

## Items

| # | Animation | Section/page | Source | Placements | AS files | Definitions | Embedded tags | Catalog MP3 |
| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | `course-g03-l01-ir-001-f1ec7620` | IR/1 | fla+swf | 2 | 21 | 43 | 272 | 0 |
| 2 | `course-g03-l01-rw-002` | RW/2 | swf-only | 1 | 3 | 347 | 1417 | 1 |
| 3 | `course-g03-l01-rw-003` | RW/3 | swf-only | 1 | 10 | 168 | 1071 | 1 |
| 4 | `course-g03-l01-rw-004` | RW/4 | swf-only | 1 | 36 | 175 | 710 | 1 |
| 5 | `course-g03-l01-rw-005` | RW/5 | swf-only | 1 | 8 | 58 | 433 | 1 |
| 6 | `course-g03-l01-vb-002` | VB/2 | fla+swf | 1 | 8 | 42 | 702 | 1 |
| 7 | `course-g03-l01-vb-003` | VB/3 | fla+swf | 1 | 45 | 280 | 422 | 1 |
| 8 | `course-g03-l01-vb-004` | VB/4 | fla+swf | 1 | 37 | 231 | 475 | 1 |
| 9 | `course-g03-l01-vb-005` | VB/5 | fla+swf | 1 | 37 | 229 | 503 | 1 |
| 10 | `course-g03-l01-vb-006` | VB/6 | fla+swf | 1 | 6 | 102 | 640 | 1 |
| 11 | `course-g03-l01-vb-007` | VB/7 | fla+swf | 1 | 91 | 104 | 272 | 1 |
| 12 | `course-g03-l01-vb-008` | VB/8 | fla+swf | 1 | 7 | 45 | 457 | 1 |
| 13 | `course-g03-l01-vb-009` | VB/9 | fla+swf | 1 | 4 | 21 | 203 | 1 |
| 14 | `course-g03-l01-vb-010` | VB/10 | fla+swf | 1 | 41 | 255 | 384 | 1 |
| 15 | `course-g03-l01-vb-011` | VB/11 | fla+swf | 1 | 17 | 64 | 350 | 1 |
| 16 | `course-g03-l01-vb-012` | VB/12 | fla+swf | 1 | 10 | 53 | 642 | 1 |
| 17 | `course-g03-l01-vb-013` | VB/13 | fla+swf | 1 | 42 | 217 | 377 | 1 |
| 18 | `course-g03-l01-vb-014` | VB/14 | fla+swf | 1 | 18 | 71 | 318 | 1 |
| 19 | `course-g03-l01-vb-015` | VB/15 | fla+swf | 1 | 6 | 26 | 241 | 1 |
| 20 | `course-g03-l01-vb-016` | VB/16 | fla+swf | 1 | 43 | 203 | 402 | 1 |
| 21 | `course-g03-l01-vb-017` | VB/17 | fla+swf | 1 | 23 | 58 | 289 | 1 |
| 22 | `course-g03-l01-in-026` | IN/26 | swf-only | 1 | 9 | 92 | 747 | 1 |
| 23 | `course-g03-l01-in-027` | IN/27 | swf-only | 1 | 20 | 97 | 285 | 1 |
| 24 | `course-g03-l01-in-038` | IN/38 | swf-only | 1 | 31 | 58 | 292 | 1 |
| 25 | `course-g03-l01-ti-002` | TI/2 | fla+swf | 1 | 56 | 255 | 521 | 1 |

## Alias placement

- `course-g03-l01-ir-001-f1ec7620` and `course-g03-l01-rw-001` retain two source placements over one exact SWF/FLA binary identity. Future route/context validation remains separate.

## Evidence limits

- The 25 canonical assets are only the first fixed-size slice of the 74-page G3 L1 catalog lesson; this is not a complete-lesson audit.
- FFDec exports ActionScript statically into a temporary directory. No ActionScript, legacy endpoint, loader, or host bridge is executed.
- Static script paths and lexical candidates do not prove event dispatch, branch reachability, runtime scenarios, random schedules, frame-domain disposition, or original behavior.
- The 24 catalog MP3 records carry language=und. Their directory/name is not promoted to an English or Spanish claim.
- Embedded audio payload inventory does not establish language, cue mapping, synchronization, listening acceptance, Replay, or runtime reachability.
- The selected course-g03-l01-vb-004 pilot workspace and its protected reviewer pins are outside this report's write set and are not refreshed or promoted by it.
- No renderer, route, migration workspace, status, approval, completion ledger, source asset, or strict gate is changed.

Audit item-set SHA-256: `c8ddaabf0effc97186aeb3456589228b84d5717cee615c4a218feccef73d1dc6`.
