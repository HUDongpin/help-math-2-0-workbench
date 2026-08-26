# Pilot audio original-runtime operator readiness

Status: **acceptance-neutral; no listening or human decision recorded**

This report re-verifies the current 16-pilot machine audio projection, every untouched v4 unsigned session kit, the bound Adobe Projector executable, and the physically hash-verified G4 L3 audio catalog. It does not say that anyone listened to audio.

## Current result

- Strict audio gate: 2/16 pass only because two pilots have source-bound no-audio negative proof.
- Fully scoped unsigned kits prepared for a named-human session attempt: 12 pilots / 70 cues.
- Partial, non-unblocking kit: 1 pilot / 1 cue.
- Blocked before listening: 1 pilot.
- Machine-only audio strict closures available now: **0**.

| Pilot | Audio gate | Operator disposition | Cues | Technical blockers / machine notes |
|---|---:|---|---:|---|
| `formula-elementary-conversion-01-01` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 2 | — |
| `formula-elementary-conversion-01-02` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 2 | — |
| `formula-elementary-conversion-01-03` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 2 | — |
| `formula-elementary-conversion-01-04` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 2 | — |
| `keyterm-elementary-acute-angle` | fail | partial-human-session-possible-but-non-unblocking | 1 | es: missing source source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/SAD/acute_angle.mp3; Machine audio audit records 1 expected but missing track(s).; migration.audio.cues does not exactly match the machine-audited audio inventory identity.; migration.audio.languages does not exactly match inventoried cue languages.; Machine audio audit still has candidate, missing, or manifest-follow-up mappings; strict audio acceptance is not ready. |
| `keyterm-elementary-computeghgh` | pass | no-listening-required-source-bound-no-audio | 0 | The source-hash-bound shipped SWF contains no audio tag/data or audio ActionScript operation, the preserved archive has no matching MP3, and neither key-term XML nor the catalog exposes a host placement that could create an external cue. |
| `course-g03-l01-vb-004` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 12 | — |
| `course-g04-l01-ir-001` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 2 | — |
| `course-g03-l06-ti-001` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 2 | — |
| `course-g04-l03-in-009` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 2 | — |
| `course-g04-l09-gs-002` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 13 | — |
| `course-g05-l13-rw-002` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 2 | — |
| `course-g03-l01-ts-008` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 13 | — |
| `course-g03-l06-fq-002-review` | fail | blocked-before-authoritative-listening | 0 | audio inventory has no resolved cue rows; 182 expected source audio path(s) are missing; 129 lesson-group candidate association(s) remain unresolved; 1 manifest follow-up item(s) remain unresolved; Audio is required but audio-inventory.csv has no rows.; Machine audio audit records 182 expected but missing track(s).; Machine audio audit still has candidate, missing, or manifest-follow-up mappings; strict audio acceptance is not ready.; Authoritative audio listening acceptance cannot be read (file does not exist).; audio listening acceptance is absent or not the exact current unsigned pending template |
| `course-g03-l08-re-001` | pass | no-listening-required-source-bound-no-audio | 0 | No DefineSound, SoundStream, StartSound, exact external association, or ActionScript audio operation was found. Authoritative listening across host-bound states remains pending before strict not-applicable acceptance. |
| `shell-course-g04-l01-index-local` | fail | unsigned-template-ready-for-named-human-original-runtime-listening | 16 | — |

## Human-only execution contract

For each pilot marked `unsigned-template-ready-for-named-human-original-runtime-listening`, the named human operator must:

1. Re-run the exact v4 kit check command below, then use the hash-bound Adobe Flash Player Projector and exact original host listed for that pilot. Do not use the JavaScript rewrite as the listening source.
2. Reach every cue through the original host's natural controls and personally listen. For each cue, record monotonic `activate → start → stop-or-complete → replay → start` events and decide spoken content/language, natural host traversal, synchronization, and Replay reset from direct observation.
3. Place the completed session and all allowed runtime artifacts under the listed `migrations/<id>/evidence/audio-*` destinations. Do **not** edit the files inside the v4 kit: they must remain exact unsigned templates so `--check` stays meaningful.
4. Replace template-only placeholders with actual values, choose either `stop` or `complete`, build the SHA-256 event chain, bind the final runtime-toolchain receipt, and ensure the final session conforms to `schemas/original-runtime-audio-listening-session.schema.json` (including removing template-only properties not admitted by the final schema).
5. Within each pilot, use the same real named-human identity in every cue session and its acceptance record. Only after every declared cue and reachable host state has actually passed may that person set the acceptance summary/decision and use the exact attestation and scope shown in the runbook.

```bash
node scripts/scaffold-audio-runtime-session-kit.mjs --check --readiness-report --output work/audio-runtime-session-kits-20260724-current-v4 --include-acute-english --id formula-elementary-conversion-01-01 --id formula-elementary-conversion-01-02 --id formula-elementary-conversion-01-03 --id formula-elementary-conversion-01-04 --id keyterm-elementary-acute-angle --id course-g03-l01-vb-004 --id course-g04-l01-ir-001 --id course-g03-l06-ti-001 --id course-g04-l03-in-009 --id course-g04-l09-gs-002 --id course-g05-l13-rw-002 --id course-g03-l01-ts-008 --id shell-course-g04-l01-index-local
```

The partial acute-angle English session may be performed, but it cannot pass strict audio while the Spanish source and cue projection remain unresolved. The FQ02 Review pilot has no valid cue inventory or kit; do not start listening for it yet.

## Scope boundary for the G4 L3 lesson audio

The G4 L3 static audit physically re-hashes 143 catalog-associated MP3 files (60 en / 83 es). This proves file identity only. It does not establish cue mapping, start frames, reachability, listening, synchronization, or Replay for the future 39-page lesson. Exactly 1 file overlaps the current pilot external-cue set; the 143-file lesson catalog must not be reported as 143 accepted pilot cues.

## Per-pilot operator cards

### `formula-elementary-conversion-01-01`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/formula-elementary-conversion-01-01` (bdd73aed1b3f310326d7a95552464e6b7c1e7b3818df709e2f5305b5e8707535).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `formula-narration-en` | en | 2893 ms | host-user-activated | `ac64efe44e1960d1abde5fb9aeb0c2d38509ae5c2bafd86351b53d1a4177a66a` | `migrations/formula-elementary-conversion-01-01/evidence/audio-listening-sessions/formula-narration-en-en.json` |
| `formula-narration-es` | es | 4743 ms | host-user-activated | `e1667a7b14a9ac38d885020a3f5fae0e947abbac74faf7231ceaff2198368d9c` | `migrations/formula-elementary-conversion-01-01/evidence/audio-listening-sessions/formula-narration-es-es.json` |

### `formula-elementary-conversion-01-02`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/formula-elementary-conversion-01-02` (4ca3bb2531f77c9f4458ada1246394b1c5093e7c203e1eaa94e745869f154a75).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `formula-narration-en` | en | 3623 ms | host-user-activated | `4f972d06f68779806b7938363acd476e26a70af0b1e4584efd9d3c5a1180891a` | `migrations/formula-elementary-conversion-01-02/evidence/audio-listening-sessions/formula-narration-en-en.json` |
| `formula-narration-es` | es | 5577 ms | host-user-activated | `23941719e38912fa61faf34cf0f4fc175d258009ddb581b079d586517f33931c` | `migrations/formula-elementary-conversion-01-02/evidence/audio-listening-sessions/formula-narration-es-es.json` |

### `formula-elementary-conversion-01-03`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/formula-elementary-conversion-01-03` (861f9f3f0ee6fe4506664abbeef21d83c8f4fd8f866ad3ac7b73ce8107fbf31c).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `formula-narration-en` | en | 2737 ms | host-user-activated | `8cb6c9995b7f27f805f4f581857ac80034502eead869f86c007f871d71618281` | `migrations/formula-elementary-conversion-01-03/evidence/audio-listening-sessions/formula-narration-en-en.json` |
| `formula-narration-es` | es | 3675 ms | host-user-activated | `8658e12deb64b1eb58f4503e48766432de336032f05e6d5ce5cb00f1d6f87887` | `migrations/formula-elementary-conversion-01-03/evidence/audio-listening-sessions/formula-narration-es-es.json` |

### `formula-elementary-conversion-01-04`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/formula-elementary-conversion-01-04` (8e8a2ce96cc2b9504313bf06bb8a49b05d2afd22a246900164a02812357b25fa).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `formula-narration-en` | en | 3206 ms | host-user-activated | `4cb95f75f46e9bb14acc59043d6ee5367d7ad2e460a78ba53371bca39456e009` | `migrations/formula-elementary-conversion-01-04/evidence/audio-listening-sessions/formula-narration-en-en.json` |
| `formula-narration-es` | es | 4092 ms | host-user-activated | `756ee31becb867396837a7c16a66d72a6e011da232e338e2362996767f309462` | `migrations/formula-elementary-conversion-01-04/evidence/audio-listening-sessions/formula-narration-es-es.json` |

### `keyterm-elementary-acute-angle`

- Disposition: `partial-human-session-possible-but-non-unblocking`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/keyterm-elementary-acute-angle` (c5dbda756d6fa54bc83f9a7a5b63e020e41abef7a06910439ed95f9460039374).
- Retained blockers: es: missing source source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/SAD/acute_angle.mp3; Machine audio audit records 1 expected but missing track(s).; migration.audio.cues does not exactly match the machine-audited audio inventory identity.; migration.audio.languages does not exactly match inventoried cue languages.; Machine audio audit still has candidate, missing, or manifest-follow-up mappings; strict audio acceptance is not ready.
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.
  - The host constructs the SAD counterpart of the exact EAD key-term track, but no matching Spanish MP3 is present for this pilot; the missing track must be confirmed and cannot be synthesized silently.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `catalog-audio-01` | en | 7871 ms | host-user-activated | `8b150d56158690d70c8f9891a72c13fdb62719b973bf970dcdeadaed612dc97f` | `migrations/keyterm-elementary-acute-angle/evidence/audio-listening-sessions/catalog-audio-01-en.json` |

### `keyterm-elementary-computeghgh`

- Disposition: `no-listening-required-source-bound-no-audio`.
- Strict audio gate: `pass`; machine-only strict closure: `false`.
- Machine disposition note: The source-hash-bound shipped SWF contains no audio tag/data or audio ActionScript operation, the preserved archive has no matching MP3, and neither key-term XML nor the catalog exposes a host placement that could create an external cue.

### `course-g03-l01-vb-004`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/course-g03-l01-vb-004` (45b9c4e05eab0e7c6d947ae4c06e1f45f03fa849d94b1aab32c81b174c6d80e2).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.
  - Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.
  - Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `catalog-audio-01` | es | 5640 ms | host-user-activated | `b594513fbc63da6f76cef1cfe55ed7e76dc5bb257a7007d4dda1d5295f6cf4f4` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/catalog-audio-01-es.json` |
| `embedded-stream-0001` | und | 392 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0001-und.json` |
| `embedded-stream-0002` | und | 2220 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0002-und.json` |
| `embedded-stream-0003` | und | 2220 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0003-und.json` |
| `embedded-stream-0004` | und | 2325 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0004-und.json` |
| `embedded-stream-0005` | und | 2403 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0005-und.json` |
| `embedded-stream-0006` | und | 2142 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0006-und.json` |
| `embedded-stream-0007` | und | 2220 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0007-und.json` |
| `embedded-stream-0008` | und | 2142 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0008-und.json` |
| `embedded-stream-0009` | und | 1985 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0009-und.json` |
| `embedded-stream-0010` | und | 2220 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0010-und.json` |
| `embedded-stream-0011` | und | 17972 ms | interaction-state | `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e` | `migrations/course-g03-l01-vb-004/evidence/audio-listening-sessions/embedded-stream-0011-und.json` |

### `course-g04-l01-ir-001`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/course-g04-l01-ir-001` (6331d64dec7e0314d8798d0efdc1bac9ea60af9e394a8cd73ebcca52740a9f8f).
- Original-runtime requirements still pending:
  - Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.
  - Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `embedded-stream-0001` | und | 11233 ms | interaction-state | `b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46` | `migrations/course-g04-l01-ir-001/evidence/audio-listening-sessions/embedded-stream-0001-und.json` |
| `embedded-stream-0002` | und | 11233 ms | interaction-state | `b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46` | `migrations/course-g04-l01-ir-001/evidence/audio-listening-sessions/embedded-stream-0002-und.json` |

### `course-g03-l06-ti-001`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/course-g03-l06-ti-001` (a9fd902cb5e4d0495184d1456e4bd01d7cf0267b22ab62dcc4eda73bea13c63c).
- Original-runtime requirements still pending:
  - Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.
  - Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `embedded-stream-0001` | und | 11233 ms | interaction-state | `722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739` | `migrations/course-g03-l06-ti-001/evidence/audio-listening-sessions/embedded-stream-0001-und.json` |
| `embedded-stream-0002` | und | 11233 ms | interaction-state | `722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739` | `migrations/course-g03-l06-ti-001/evidence/audio-listening-sessions/embedded-stream-0002-und.json` |

### `course-g04-l03-in-009`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/course-g04-l03-in-009` (e7fe03a68a8bc1fd60fe321d9e34520cc83b1fc79189e09c8ffa84c2a6d2f950).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.
  - Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.
  - Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `catalog-audio-01` | es | 40344 ms | host-user-activated | `1d2370d59a6400dbd666a3f049fd4222a54d664e62055a1fb5f93596b9a2ea4b` | `migrations/course-g04-l03-in-009/evidence/audio-listening-sessions/catalog-audio-01-es.json` |
| `embedded-stream-0001` | und | 48901 ms | interaction-state | `766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c` | `migrations/course-g04-l03-in-009/evidence/audio-listening-sessions/embedded-stream-0001-und.json` |

### `course-g04-l09-gs-002`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/course-g04-l09-gs-002` (32decd8c75e1e22baf7fded0c1243dcc2bbf7129fe2a5e57423447b3e14b1594).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.
  - Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.
  - Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `catalog-audio-01` | es | 44544 ms | host-user-activated | `fc1d611959deedae1d0ac4005b09c416fbd1711536c3190d190795798a4ad9d3` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/catalog-audio-01-es.json` |
| `embedded-stream-0001` | und | 392 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0001-und.json` |
| `embedded-stream-0002` | und | 7314 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0002-und.json` |
| `embedded-stream-0003` | und | 7314 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0003-und.json` |
| `embedded-stream-0004` | und | 7314 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0004-und.json` |
| `embedded-stream-0005` | und | 6740 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0005-und.json` |
| `embedded-stream-0006` | und | 6975 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0006-und.json` |
| `embedded-stream-0007` | und | 6818 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0007-und.json` |
| `embedded-stream-0008` | und | 7053 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0008-und.json` |
| `embedded-stream-0009` | und | 7811 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0009-und.json` |
| `embedded-stream-0010` | und | 3396 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0010-und.json` |
| `embedded-stream-0011` | und | 9221 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0011-und.json` |
| `embedded-stream-0012` | und | 50573 ms | interaction-state | `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15` | `migrations/course-g04-l09-gs-002/evidence/audio-listening-sessions/embedded-stream-0012-und.json` |

### `course-g05-l13-rw-002`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/course-g05-l13-rw-002` (166280ac3087b3d396c878f236eb814a14901130947a3a0bdb625de9cbc8f4dc).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.
  - Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.
  - Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `catalog-audio-01` | es | 26544 ms | host-user-activated | `2e809c69df60cec11427a71d38b37b830a0a9ec805e3c8ff4f68734cb53bfcd2` | `migrations/course-g05-l13-rw-002/evidence/audio-listening-sessions/catalog-audio-01-es.json` |
| `embedded-stream-0001` | und | 155611 ms | interaction-state | `bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6` | `migrations/course-g05-l13-rw-002/evidence/audio-listening-sessions/embedded-stream-0001-und.json` |

### `course-g03-l01-ts-008`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/course-g03-l01-ts-008` (1fc4251ae750b976c2e78a1ac1a475c24c20fd6101da722eacf8c583a61f859f).
- Original-runtime requirements still pending:
  - Adobe/original-host listening must verify spoken language/content, user-trigger behavior, start timing, pause/resume, and completion for every exact external track.
  - Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.
  - Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `catalog-audio-01` | es | 9408 ms | host-user-activated | `e81753a65c066c3b0112abf7dda689712a15aa022c8cc5ee7b4e38724c9fb734` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/catalog-audio-01-es.json` |
| `embedded-stream-0001` | und | 5721 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0001-und.json` |
| `embedded-stream-0002` | und | 392 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0002-und.json` |
| `embedded-stream-0003` | und | 2220 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0003-und.json` |
| `embedded-stream-0004` | und | 2220 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0004-und.json` |
| `embedded-stream-0005` | und | 2325 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0005-und.json` |
| `embedded-stream-0006` | und | 2403 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0006-und.json` |
| `embedded-stream-0007` | und | 2142 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0007-und.json` |
| `embedded-stream-0008` | und | 2220 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0008-und.json` |
| `embedded-stream-0009` | und | 1985 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0009-und.json` |
| `embedded-stream-0010` | und | 2220 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0010-und.json` |
| `embedded-stream-0011` | und | 1082 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0011-und.json` |
| `embedded-stream-0012` | und | 60473 ms | interaction-state | `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b` | `migrations/course-g03-l01-ts-008/evidence/audio-listening-sessions/embedded-stream-0012-und.json` |

### `course-g03-l06-fq-002-review`

- Disposition: `blocked-before-authoritative-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Retained blockers: audio inventory has no resolved cue rows; 182 expected source audio path(s) are missing; 129 lesson-group candidate association(s) remain unresolved; 1 manifest follow-up item(s) remain unresolved; Audio is required but audio-inventory.csv has no rows.; Machine audio audit records 182 expected but missing track(s).; Machine audio audit still has candidate, missing, or manifest-follow-up mappings; strict audio acceptance is not ready.; Authoritative audio listening acceptance cannot be read (file does not exist).; audio listening acceptance is absent or not the exact current unsigned pending template

### `course-g03-l08-re-001`

- Disposition: `no-listening-required-source-bound-no-audio`.
- Strict audio gate: `pass`; machine-only strict closure: `false`.
- Machine disposition note: No DefineSound, SoundStream, StartSound, exact external association, or ActionScript audio operation was found. Authoritative listening across host-bound states remains pending before strict not-applicable acceptance.

### `shell-course-g04-l01-index-local`

- Disposition: `unsigned-template-ready-for-named-human-original-runtime-listening`.
- Strict audio gate: `fail`; machine-only strict closure: `false`.
- Exact original host: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf` (04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd).
- Unsigned kit: `work/audio-runtime-session-kits-20260724-current-v4/shell-course-g04-l01-index-local` (24a4d8eff99fbee1f15192bba3550415768fd8d4175bde8bedc5b04b33f9e96a).
- Original-runtime requirements still pending:
  - Adobe/original-runtime listening is required to classify embedded speech versus effects, confirm language, and verify synchronization/loop/stop behavior.
  - Nested SoundStream local frames are known, but an authoritative traversal must map each sprite instance and interaction branch to its root/runtime cue time.
  - ActionScript audio calls are conditional/event-driven; host state and interaction traversal must prove resolved URL/linkage, invocation order, offsets, loops, and stop behavior.

| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |
|---|---:|---:|---|---|---|
| `embedded-define-sound-0001` | und | 4598 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-define-sound-0001-und.json` |
| `embedded-define-sound-0002` | und | 20193 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-define-sound-0002-und.json` |
| `embedded-define-sound-0149` | und | 13 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-define-sound-0149-und.json` |
| `embedded-define-sound-0150` | und | 57 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-define-sound-0150-und.json` |
| `embedded-stream-0100` | und | 392 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0100-und.json` |
| `embedded-stream-0137` | und | 575 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0137-und.json` |
| `embedded-stream-0141` | und | 810 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0141-und.json` |
| `embedded-stream-0144` | und | 575 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0144-und.json` |
| `embedded-stream-0147` | und | 575 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0147-und.json` |
| `embedded-stream-0150` | und | 575 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0150-und.json` |
| `embedded-stream-0153` | und | 575 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0153-und.json` |
| `embedded-stream-0155` | und | 575 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0155-und.json` |
| `embedded-stream-0157` | und | 888 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0157-und.json` |
| `embedded-stream-0177` | und | 888 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0177-und.json` |
| `embedded-stream-0197` | und | 575 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0197-und.json` |
| `embedded-stream-0206` | und | 392 ms | interaction-state | `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e` | `migrations/shell-course-g04-l01-index-local/evidence/audio-listening-sessions/embedded-stream-0206-und.json` |
