# G5 L5 Pre-implementation Specification Readiness

> Machine-only M1 static reconciliation verification. Canonical static facts and script/dependency inventories create no complexity, reachability, behavior, scenario, frame-domain, runtime, audio-listening, renderer, implementation, review, acceptance, strict-completion, or publication authority.

- Release: `lesson-g05-l05-add-subtract-negative-numbers` — Add & Subtract Negative Numbers
- Members: **57** (56 pages + 1 shell)
- Pre-runtime candidate packages: **57/57** (399 hash-bound files)
- M1 machine-only static reconciliations: **57/57**
- Report fingerprint: `a2a01d1df6385f4bd99d2fe0ae5d187c289a40c62fcbbe2537faae0389ff4a25`
- Implementation-specification ready: **0/57**
- Implementation started: **0/57**; authorized by this report: **0**
- Strict complete: **0/57**; published: **false**

## Exact readiness counts

| Area | Current state |
|---|---:|
| Source/root metadata machine-verified | 57/57 |
| Acceptance-neutral candidate packages | 57/57 (399 files; seven per member) |
| M1 machine-only static reconciliation receipts | 57/57 |
| Candidate artifact classes | runtime facts 57/57; asset census 57/57; definition CSV 57/57; scripts 57/57; dependencies 57/57; brief prefill 57/57; receipts 57/57 |
| Manifest runtime facts fully reconciled | 0/57 |
| Manifest exact static facts reconciled | 57/57; complexity unknown 57/57 |
| Asset inventories populated | 0/57 canonical (0 rows); 9767 machine definition candidates materialized |
| Audio inventories populated | 54/57 (285 structural rows; 0 accepted/not-required dispositions; 57/57 human listening decisions pending) |
| Keyframe inventories populated | 0/57 (0 rows) |
| Coverage | 114 root-only requirements; 1220/1220 frames missing |
| Migration briefs substantively completed | 0/57 (0 templates; renderer unselected 57/57) |
| Machine audits complete | 0/57 (57 partial) |
| Frame-domain dispositions | 57/57 present; 0/57 complete; 1232/1232 nested reachability unresolved |
| Scenario inventories present | 57/57 (57 default placeholders) |
| Script exports reconciled | 57/57 canonical; 2456 script candidates materialized |
| Dependency inventories present | 57/57 canonical; 57/57 static candidates materialized |
| Canonical M1 static inventories | scripts 57/57; dependencies 57/57; runtime reachability unresolved 57/57 |
| External-call candidates | 3 members; 6 API rows; 17 occurrences |

## Routing boundary

The acceptance-neutral machine work is materialized for **57/57** members (**285/285** task instances); remaining automatically advanceable task instances: **0**. All **57/57** still require original-runtime or human decisions before rendering can start. Machine-only static reconciliation cannot satisfy the second category.

### Materialized automatically advanceable candidate work

- `machine-sync-manifest-runtime-facts`: Copy hash-bound SWF signature/version, stage, FPS, root frame count, duration, background, AS generation, and tool versions from the checked machine audit into a reviewable candidate patch.
- `machine-materialize-asset-candidates`: Materialize source-tag-backed asset candidates with character IDs and provenance. This does not choose renderer transformations or prove visual completeness.
- `machine-materialize-script-candidates`: Index the existing FFDec script export into candidate script records and bind each record to the source SWF and export hashes.
- `machine-materialize-static-dependency-candidates`: Record static external-call and dependency candidates from the machine audit without executing legacy endpoints or deciding runtime reachability.
- `machine-prefill-brief-static-sections`: Prefill identity, source, native root metadata, structural tag counts, and unresolved evidence boundaries in the migration brief; leave instructional and renderer decisions unanswered.

### Requires original runtime or human decision

- `human-read-only-authoring-audit`: A named human must inspect the paired legacy FLA through the reviewed read-only Animate protocol; preparation artifacts do not count as an authoring audit.
- `human-swf-only-source-gap-disposition`: A human must record whether the missing paired FLA can be recovered or whether the shipped-SWF-only limitation remains an explicit source gap.
- `original-runtime-reachable-scenarios-and-natural-traces`: An authorized original runtime must establish reachable scenarios, branches, host entry, event schedules, terminal states, Replay, languages, and deterministic/random behavior.
- `original-runtime-frame-domain-reachability-and-entry-state`: An authorized original runtime plus source review must resolve which nested definitions are root-reachable and bind each reachable domain to placement and entry-state evidence.
- `original-runtime-keyframes-and-behavior-map`: Original-runtime observation and human instructional review must identify teaching beats, visual transitions, interaction states, formulas, terminal states, and Replay keyframes.
- `original-runtime-audio-listening-language-and-sync`: A named listener in the authorized original runtime must decide cue reachability, spoken language/content, synchronization, stop/loop behavior, or a source-bound not-required disposition.
- `human-renderer-accessibility-and-localization-decision`: A human must choose and justify the renderer, rejected alternatives, accessibility behavior, localization approach, and asset transformation strategy.
- `human-external-call-security-disposition`: A human security/product decision must disposition every static legacy external-call candidate without invoking the endpoint.
- `authoritative-baseline-requirement-plan`: Requirement-level original-runtime authority and full reachable coverage must be defined before implementation capture can be compared.

## External-call candidates requiring explicit disposition

- `course-g05-l05-fq-002`: getURL (2).
- `course-g05-l05-fq-003`: getURL (1).
- `shell-course-g05-l05-index-local`: SharedObject (1), fscommand (5), getURL (3), loadMovie (5).

These candidates were not executed. A static scan with no candidate is not a runtime dependency clearance.

## Per-member state

| # | Animation | Source | Candidate files | Canonical assets | Audio | Keyframes | Coverage | Nested unresolved | Candidate/canonical scripts | External calls | Spec ready |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| 1 | `course-g05-l05-ir-001-664ab764` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 3/3 | 9/1 | none | no |
| 2 | `course-g05-l05-rw-002` | shipped-swf-only | 7 | 0 | 3 | 0 | 2 pending | 3/3 | 3/1 | none | no |
| 3 | `course-g05-l05-rw-003` | shipped-swf-only | 7 | 0 | 2 | 0 | 2 pending | 8/8 | 4/1 | none | no |
| 4 | `course-g05-l05-rw-004` | shipped-swf-only | 7 | 0 | 2 | 0 | 2 pending | 10/10 | 8/1 | none | no |
| 5 | `course-g05-l05-vb-002` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 3/1 | none | no |
| 6 | `course-g05-l05-vb-003` | paired-fla-and-shipped-swf | 7 | 0 | 6 | 0 | 2 pending | 18/18 | 52/1 | none | no |
| 7 | `course-g05-l05-vb-004` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 6/1 | none | no |
| 8 | `course-g05-l05-vb-005` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 14/1 | none | no |
| 9 | `course-g05-l05-vb-006` | paired-fla-and-shipped-swf | 7 | 0 | 8 | 0 | 2 pending | 20/20 | 63/1 | none | no |
| 10 | `course-g05-l05-vb-007` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 6/1 | none | no |
| 11 | `course-g05-l05-vb-008` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 8/1 | none | no |
| 12 | `course-g05-l05-vb-009` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 8/1 | none | no |
| 13 | `course-g05-l05-vb-010` | paired-fla-and-shipped-swf | 7 | 0 | 3 | 0 | 2 pending | 11/11 | 31/1 | none | no |
| 14 | `course-g05-l05-vb-011` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 11/1 | none | no |
| 15 | `course-g05-l05-vb-012` | paired-fla-and-shipped-swf | 7 | 0 | 12 | 0 | 2 pending | 17/17 | 33/1 | none | no |
| 16 | `course-g05-l05-vb-013` | paired-fla-and-shipped-swf | 7 | 0 | 12 | 0 | 2 pending | 18/18 | 34/1 | none | no |
| 17 | `course-g05-l05-vb-014` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 10/1 | none | no |
| 18 | `course-g05-l05-in-002` | shipped-swf-only | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 7/1 | none | no |
| 19 | `course-g05-l05-in-003` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 8/1 | none | no |
| 20 | `course-g05-l05-in-004` | paired-fla-and-shipped-swf | 7 | 0 | 6 | 0 | 2 pending | 16/16 | 55/1 | none | no |
| 21 | `course-g05-l05-in-005` | paired-fla-and-shipped-swf | 7 | 0 | 7 | 0 | 2 pending | 17/17 | 63/1 | none | no |
| 22 | `course-g05-l05-in-006` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 7/1 | none | no |
| 23 | `course-g05-l05-in-007` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 10/1 | none | no |
| 24 | `course-g05-l05-in-008` | paired-fla-and-shipped-swf | 7 | 0 | 6 | 0 | 2 pending | 7/7 | 32/1 | none | no |
| 25 | `course-g05-l05-in-009` | paired-fla-and-shipped-swf | 7 | 0 | 12 | 0 | 2 pending | 15/15 | 40/1 | none | no |
| 26 | `course-g05-l05-in-010` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 4/1 | none | no |
| 27 | `course-g05-l05-in-011` | shipped-swf-only | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 2/1 | none | no |
| 28 | `course-g05-l05-in-012` | paired-fla-and-shipped-swf | 7 | 0 | 6 | 0 | 2 pending | 7/7 | 22/1 | none | no |
| 29 | `course-g05-l05-in-013` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 5/1 | none | no |
| 30 | `course-g05-l05-in-014` | paired-fla-and-shipped-swf | 7 | 0 | 8 | 0 | 2 pending | 18/18 | 40/1 | none | no |
| 31 | `course-g05-l05-in-015` | paired-fla-and-shipped-swf | 7 | 0 | 6 | 0 | 2 pending | 20/20 | 33/1 | none | no |
| 32 | `course-g05-l05-in-016` | shipped-swf-only | 7 | 0 | 6 | 0 | 2 pending | 21/21 | 50/1 | none | no |
| 33 | `course-g05-l05-in-017` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 8/1 | none | no |
| 34 | `course-g05-l05-in-018` | paired-fla-and-shipped-swf | 7 | 0 | 5 | 0 | 2 pending | 24/24 | 67/1 | none | no |
| 35 | `course-g05-l05-in-019` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 3/3 | 7/1 | none | no |
| 36 | `course-g05-l05-in-020` | paired-fla-and-shipped-swf | 7 | 0 | 6 | 0 | 2 pending | 23/23 | 58/1 | none | no |
| 37 | `course-g05-l05-ti-002` | paired-fla-and-shipped-swf | 7 | 0 | 10 | 0 | 2 pending | 33/33 | 64/1 | none | no |
| 38 | `course-g05-l05-ti-003` | paired-fla-and-shipped-swf | 7 | 0 | 8 | 0 | 2 pending | 20/20 | 46/1 | none | no |
| 39 | `course-g05-l05-ti-004` | paired-fla-and-shipped-swf | 7 | 0 | 9 | 0 | 2 pending | 20/20 | 46/1 | none | no |
| 40 | `course-g05-l05-ti-005` | paired-fla-and-shipped-swf | 7 | 0 | 7 | 0 | 2 pending | 25/25 | 66/1 | none | no |
| 41 | `course-g05-l05-ti-006` | paired-fla-and-shipped-swf | 7 | 0 | 9 | 0 | 2 pending | 36/36 | 103/1 | none | no |
| 42 | `course-g05-l05-ti-007` | paired-fla-and-shipped-swf | 7 | 0 | 8 | 0 | 2 pending | 20/20 | 48/1 | none | no |
| 43 | `course-g05-l05-ti-008` | paired-fla-and-shipped-swf | 7 | 0 | 7 | 0 | 2 pending | 17/17 | 46/1 | none | no |
| 44 | `course-g05-l05-ti-009` | paired-fla-and-shipped-swf | 7 | 0 | 7 | 0 | 2 pending | 22/22 | 65/1 | none | no |
| 45 | `course-g05-l05-ti-010` | paired-fla-and-shipped-swf | 7 | 0 | 6 | 0 | 2 pending | 20/20 | 50/1 | none | no |
| 46 | `course-g05-l05-gs-002` | shipped-swf-only | 7 | 0 | 10 | 0 | 2 pending | 52/52 | 85/1 | none | no |
| 47 | `course-g05-l05-ts-002` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 6/1 | none | no |
| 48 | `course-g05-l05-ts-003` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 5/1 | none | no |
| 49 | `course-g05-l05-ts-004` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 10/1 | none | no |
| 50 | `course-g05-l05-ts-005` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 14/1 | none | no |
| 51 | `course-g05-l05-ts-006` | paired-fla-and-shipped-swf | 7 | 0 | 2 | 0 | 2 pending | 1/1 | 3/1 | none | no |
| 52 | `course-g05-l05-ts-007` | paired-fla-and-shipped-swf | 7 | 0 | 13 | 0 | 2 pending | 22/22 | 92/1 | none | no |
| 53 | `course-g05-l05-ts-008` | paired-fla-and-shipped-swf | 7 | 0 | 13 | 0 | 2 pending | 20/20 | 86/1 | none | no |
| 54 | `course-g05-l05-fq-001` | paired-fla-and-shipped-swf | 7 | 0 | 0 | 0 | 2 pending | 7/7 | 14/1 | none | no |
| 55 | `course-g05-l05-fq-002` | paired-fla-and-shipped-swf | 7 | 0 | 0 | 0 | 2 pending | 213/213 | 123/1 | getURL:2 | no |
| 56 | `course-g05-l05-fq-003` | paired-fla-and-shipped-swf | 7 | 0 | 0 | 0 | 2 pending | 213/213 | 123/1 | getURL:1 | no |
| 57 | `shell-course-g05-l05-index-local` | shipped-swf-only | 7 | 0 | 16 | 0 | 2 pending | 192/192 | 540/1 | SharedObject:1, fscommand:5, getURL:3, loadMovie:5 | no |

## Write and acceptance boundary

- Workspace files modified/created: **0/0**.
- Candidate files observed/created by this report generator: **399/0**; canonical files modified by the candidate materializer: **0**.
- Scenario inventories, frame-domain dispositions, strict-readiness artifacts created: **0/0/0**.
- Authoritative runtime sessions/baselines: **0/0**.
- Implementation authorized: **no**; strict complete: **no**; published: **no**.
