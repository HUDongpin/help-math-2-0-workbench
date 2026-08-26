# course-g04-l01-ir-001 Migration Brief

Created: 2026-07-20

Engineering candidate updated: 2026-07-22

## Objective and disposition

Provide a native Next.js/React/Canvas engineering candidate for Grade 4 Lesson 1 Introduction (`IR/L1RW01.swf`) while preserving every unresolved source obligation. The candidate exposes the 142-frame `Animation03`/`sprite-58` visual timeline and the ten-frame Adobe standalone root scenario deterministically, models both source random sound selections, supports Replay and responsive layout, and preserves the same untranslated source visual for English and Spanish requests.

This is not a complete or strict migration. Status remains `preserved`; engineering, strict human visual, and owner review remain pending. The project user renewed the scope-limited approval of the current JavaScript output on 2026-07-22, bound in `reports/current-javascript-output-human-approval.json`; that approval does not establish Flash parity or satisfy the strict all-diff human-review gate.

## Identity and source

- `animationId`: `course-g04-l01-ir-001`.
- `assetId`: `swf-b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46`.
- Classification: course, Grade 4, Lesson 1, Introduction, number sense and place value; confirmed from the lesson XML and source placement.
- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.fla`; SHA-256 `c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9`.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf`; SHA-256 `b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46`.
- Both owner-provided sources remain untouched and hash-verified.

## Runtime and authoring audit

- CWS, SWF version 6, AS1/2, 800 × 600, 12 FPS, `#b8d8f7` background.
- The root movie has 10 frames. It stops at frame 1, calls `_level0.InternalPreloader.gotoAndPlay("jump_check")`, and places source instance `animation` / object 58 at labeled frame 6 (`begin`) before stopping again.
- `sprite-58`, matched to FLA library symbol `Animation03`, has 142 frames and stops at 142. Frame 1 runs `random(2)` and selects `Mc_Sound_0`/sprite 7 or `Mc_Sound_1`/sprite 8; frame 5 starts the selected nested sound timeline.
- Sprites 7 and 8 each contain 135-frame MP3 SoundStreams, stereo 22,050 Hz, approximately 11.233 seconds. Their spoken language, correct original-host branch, root cue time, synchronization, stop, and Replay behavior remain unresolved.
- Static audit also found one button, 10 sprites, four embedded font definitions, 18 `DoAction`, two `DoInitAction`, and legacy FScrollBar component code. Original host/global defaults and five statically unproved sprite timelines are unresolved.
- Adobe Animate 2021 `MAC 21.0.7.42652` opened the FLA read-only in a fresh process. It confirmed the native document, 10-frame root, four root layers, 52 library items, and the 142-frame `Animation03` symbol. Animate warned that AS1 is unsupported and converted only the in-memory document, so the SWF remains authoritative for scripts. Evidence: `audit/adobe-animate-2021-authoring-audit.json`.

## Baseline boundary

Adobe Flash Player 32.0.0.414 captured all ten standalone root frames losslessly at 800 × 600. This is authoritative only for the untouched SWF's English standalone-default root scenario. It does not reconstruct the parent course shell, deterministic random branches, 142 local frames, Spanish, interaction states, or audio.

Five empirical visual-state cross-checks align Adobe root frames to candidate local frames, but are deliberately not treated as timing or frame-identity evidence:

| Adobe root | Candidate local | normalized RMSE |
|---:|---:|---:|
| 1 | 1 | 0.00688424 |
| 7 | 23 | 0.00689521 |
| 8 | 40 | 0.00841955 |
| 9 | 56 | 0.04218905 |
| 10 | 72 | 0.01176338 |

All five are below the static 0.05 threshold, but they are selected candidate cross-checks only. Evidence and diffs: `evidence/nextjs-native-candidate-visual-evidence.json` and `evidence/candidate-standalone-alignment/`.

## Rendering and timeline decision

- Renderer: native Canvas using a same-origin, hash-bound generated JavaScript asset for `sprite-58` and byte-identical Adobe standalone capture assets for the root domain.
- Generator: `scripts/build-safe-ffdec-canvas-adapter.mjs`; specification: `audit/canvas-adapter-spec.json`.
- Generated runtime: `public/flash-assets/courses/course-g04-l01-ir-001/canvas-renderer.js`; SHA-256 `2f8e103fd39bfbe957d81ab6aeae07693c40f01afc7cd5c09101def5417d3043`.
- Generated asset manifest: `public/flash-assets/courses/course-g04-l01-ir-001/manifest.json`; SHA-256 `e0d287f831945df837872d6e31596adce9ed00484bef9697831846b49b704f62`.
- Root asset manifest: `public/flash-assets/courses/course-g04-l01-ir-001/root-standalone/manifest.json`; SHA-256 `081993969579c450acde4310142e9a0cf6fad259276a1ddbef69d801b5c3a444`. Its ten 800 × 600 PNGs are byte-identical to the hash-bound Adobe standalone baseline frames.
- The adapter allowlists source-derived vector/text drawing functions and contains no legacy ActionScript execution, dynamic evaluation, network primitive, timer, storage, or ambient DOM listener.
- Public capture frames are one-indexed and domain-explicit: `root` frames 1–10 use `root-standalone`, while `sprite-58` frames 1–142 use the three structural sound scenarios. No false one-to-one root/local mapping is claimed.
- Root rendering reproduces only the captured Adobe standalone source pixels in either requested language context; this is not a Spanish translation and does not reconstruct `InternalPreloader`, parent course-shell variables, audio, random outcomes, or host navigation.
- `sound-from-seed`, `sound-0`, and `sound-1` expose the structural random outcomes. They are visually identical because the only proven difference is omitted audio.
- `lang=es` renders the same untranslated source Canvas in both frame domains and reports the source-shared visual disposition; it does not invent translated artwork or accept Spanish parity.

## Implementation map

- Route: `/en/animations/course-g04-l01-ir-001`.
- React module: `packages/demos/src/modules/course-g04-l01-ir-001.tsx`.
- Pure timeline: `packages/demos/src/timelines/course-g04-l01-ir-001.ts`.
- Tests: `packages/demos/tests/course-g04-l01-ir-001.test.ts`.
- Registry module: `./modules/course-g04-l01-ir-001` via the generated animation registry.
- Reference route: `/en/reference/course-g04-l01-ir-001`, local forensic use only.
- Deterministic contract: `?frameDomain=`, `?frame=`, `?scenario=`, `?lang=`, `?seed=`, `?requirementId=`, `?trace=`, and `?entryStateSha256=` with exact `data-flash-*` identity reporting.
- Standalone package: not requested.

## Candidate verification

- The historical schema-v2 candidate visual report captured 426 English-only frames against the previous Canvas bytes. It is intentionally stale after the en/es renderer regeneration and is not rebound to the current runtime.
- The current schema-v4 v7 capture adoption validates 872/872 current-JavaScript frames: both languages across the root scenario and all three `sprite-58` scenarios, at native 800 × 600 with exact deterministic identity. This remains non-authoritative current-JavaScript evidence only.
- Reproducible Chromium QA passes all 14 assertions against the current runtime: source/runtime hashes; all ten root assets; every root frame at native 800 × 600 with exact identity and normalized RMSE `0`; deterministic local frames; pointer/Enter/Space Replay reset and resume; source-shared untranslated visual rendering in both language contexts; 390 × 844 responsive layout without horizontal overflow; reduced-motion terminal freeze; overlay suppression; and clean console/network diagnostics.
- Browser evidence: `evidence/nextjs-native-candidate-qa.json`; generated by `scripts/qa-ir-001-candidate.mjs` with Chromium 149.0.7827.55 and Playwright 1.61.1.
- Schema-v4 adoption: `evidence/current-javascript-implementation-capture-adoption.json`; all eight requirements and 872 frames are present, while original-runtime authority, RMSE parity, audio, behavior, human/owner review, and strict completion remain explicitly false.
- The renderer support audit reports exact renderable identity for all 16 IR001 endpoint probes in both language contexts.
- These results validate the current JavaScript engineering candidate and the limited Adobe standalone root scenario only. They do not provide strict local-timeline, translated-Spanish, audio, host, human, or owner parity.

## Blocking acceptance gaps

- No authoritative original-host traversal covers all 142 local frames for both random outcomes.
- Both embedded MP3 streams are omitted; authoritative listening, language identity, cue timing, synchronization, stop, and Replay remain pending.
- Spanish translation/audio and the `InternalPreloader`/course-shell contract are unresolved; only the source-shared untranslated visual is established.
- The modern Replay control is tested, but original legacy Replay semantics are not source-proven.
- `keyframes.csv` and strict full-frame comparison combinations remain intentionally unpopulated because candidate captures cannot substitute for an authoritative baseline.
- No named human reviewer has inspected every required source/implementation diff, and no owner has signed acceptance.

Strict validator completion is therefore expected to fail. No exception has owner decision `accepted`, and the migration must not appear in the public complete-only library.
