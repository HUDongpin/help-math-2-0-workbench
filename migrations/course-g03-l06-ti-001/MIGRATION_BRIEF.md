# course-g03-l06-ti-001 Migration Brief

Created: 2026-07-20
Last technical revision: 2026-07-22

## Objective

Rebuild the shipped Grade 3, Lesson 6, Try It SWF as a native Next.js animation while preserving its source coordinate system, drawing timeline, random branch obligations, and unresolved evidence boundaries. The requested product languages are English and Spanish. This exact child SWF contains one visual timeline with an embedded English title and no language branch; therefore `lang=es` preserves the shipped pixels and must not be described as a Spanish translation. Both embedded audio streams have been byte-exactly extracted and connected to the modern random branches; authoritative listening must still identify their language/content and verify cue synchronization, stopping, and Replay behavior.

## Identity And Classification

- Immutable asset ID: `swf-722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739`.
- Placement ID: `course-g03-l06-ti-001`.
- Collection: course; Grade 3; Lesson 6; section `TI` / Try It; page 1.
- Raw and current display title: `L6TI01`; the source artwork says `Decimals & Money: Try It!`.
- Lesson title evidence: `Decimals & Money` in `HELP_COURSES/ELMGR3/L6/index.xml`.
- Controlled domain: fractions, decimals, and percents.
- Classification: inferred from the preserved path and course XML. The active XML contains a placement conflict/commented reference, so historical shell reachability is not yet proved.
- Alias/variant: none. This placement is not a variant of itself.

## Source Evidence

- FLA: unavailable for this placement.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf`.
- Provenance: owner-provided preserved source.
- SWF SHA-256: `722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739`; 1,657,172 preserved bytes. The machine audit verified the same hash before and after inspection.
- Missing evidence: FLA authoring timeline/library, original parent-shell session, lossless authoritative full-frame runtime capture, authoritative audio listening, and historical Replay policy.
- Evidence conflict: the XML placement is commented/conflicted while the SWF exists. The source is migrated as a preserved placement, but the brief does not infer active historical shell reachability.

## Runtime Audit

- SWF: version 6, ZLIB-compressed, 800 × 600 stage, `#b8d8f7` background, 12 FPS.
- Root timeline: 10 one-indexed frames. Root frame 1 calls `stop()`. Labeled frame 6 (`begin`) places `sprite-21` as `animation` and also stops.
- Main content: `sprite-21`, 142 frames, placed at `(8248, 5666)` twips / `(412.4, 283.3)` pixels. Frame 142 calls `stop()`.
- ActionScript: AS1/2. The audit found 18 `DoAction`, 2 `DoInitAction`, and no external-call candidates.
- Visual assets: five `DefineShape`, four clipped/tiled bitmap uses backed by embedded JPEG data, three `DefineText`, and one `DefineFont2`. There are no `DefineEditText` fields, FlashVars candidates, or language/locale script reads.
- Random/audio behavior: `sprite-21` frame 1 evaluates `random(2)` and stores `Mc_Sound_0` or `Mc_Sound_1`; frame 5 requests `gotoAndPlay(2)` on only the selected child. Both children are present through parent frame 136 and removed at frame 137.
- Audio: two 135-frame MP3 SoundStream timelines (`sprite-7` and `sprite-8`), each 135 stream blocks, 22,050 Hz stereo, 247,680 decoded samples / approximately 11.233 seconds. The migration factory concatenated the original MP3 bytes from all 135 `SoundStreamBlock` payloads without transcoding and verified the resulting hashes. The modern sound-0/sound-1 branches start their corresponding asset at the source frame-5 request and stop it at frame-137 removal. Their spoken language/content, original-runtime tick phase and synchronization, audible quality, and Replay behavior remain unresolved pending authorized listening.
- Child-playhead authority: frame 1 stopped and frame 5's `gotoAndPlay(2)` request are exact source facts. The child tick phase after that request is not projected from the parent frame number.
- Composite disposition: the two sound sprites have evidence-backed `audio-only-offstage-visual-marker` disposition. Their only shape remains completely outside the 800 × 600 stage after the full root→parent→child matrix chain. This closes visual frame-domain enumeration only; it satisfies no audio or behavior gate.
- Tooling: JPEXS FFDec 26.2.1, swfmill 0.3.6, OpenJDK 21.0.11, Chromium 150.0.7871.129. Adobe Animate 2021 21.0.7 is installed, but no FLA exists for this placement, so Animate authoring inspection was not used.
- Confidence: high for header/tag/script/placement facts tied to the source hash; medium for FFDec drawing reconstruction; unavailable for original host reachability, audio semantics, and full-runtime visual parity.

## Baseline

- Current authority: engineering cross-check only, not a strict baseline.
- Available probe: Adobe standalone Flash Player 32 nested-frame capture at native size. It directly seeks the child timeline, is JPEG-derived, includes the pointer, and does not reproduce natural parent-shell execution.
- Viewport: 800 × 600 at device scale factor 1.
- Known mismatch: the frame-14 probe appears almost white while the current Canvas reconstruction uses the audited `#b8d8f7` source background. Until a lossless authoritative session resolves this, no RMSE from that probe is accepted.
- Required strict baseline: lossless native-size frames for root direct-seek structure and every frame of both naturally observed `sound-0` and `sound-1` sessions, including entry state and parent/child trace identity.

## Rendering Decision

- Renderer: React for the structural root background and controls; a generated, hash-pinned local Canvas adapter for `sprite-21` drawings.
- Reason: the source drawing export contains many canvas path/bitmap operations and benefits from the original fixed coordinate system. Pure TypeScript owns source facts and deterministic request state; the generated asset contains no timers, autoplay, network primitives, dynamic evaluation, or legacy ActionScript execution.
- Rejected as production authority: Ruffle, video, and unconstrained FFDec viewer code. Ruffle/Adobe probes remain forensic evidence only; video would discard interaction and frame identity.
- Native stage: fixed 800 × 600 Canvas backing store with a responsive 4:3 wrapper.
- Localization: `en` and `es` render the exact same source drawing timeline. UI copy may be localized separately, but the embedded English title is intentionally not rewritten without source evidence.
- Accessibility: the Canvas has a descriptive image role/name and the host owns keyboard Replay and reduced-motion behavior. These checks must be rerun after every renderer/asset revision before the manifest flags become true.

## Timeline Specification

- Root direct-seek domain: frames 1–10 reproduce the hash-bound uniform source background. This domain is structural inspection, not natural 1→10 playback. Natural root playback stops at frame 1; the missing host must enter frame 6, which also stops.
- `sprite-21` frame 1: both sound children are stopped at local frame 1; source `random(2)` selects one outcome. The visual drawing does not depend on the outcome.
- Frames 2–4: selected outcome remains known; both sound instances remain placed and stopped at their source frame-1 state.
- Frame 5: exact source request `gotoAndPlay(2)` is issued to the selected child. `audioStartRequested` is true only on this frame.
- Frames 6–136: both sound instances remain placed. Their post-request child playhead and audible synchronization are `runtime-tick-phase-unresolved`; no fabricated child frame is exposed.
- Frame 137: both sound instances are removed by the parent; the pure state reports no selected child frame.
- Frames 138–141: no sound child remains placed.
- Frame 142: source terminal `stop()`; natural local playback ends here.
- Source scenarios: `sound-0` and `sound-1` must be observed on untouched original-runtime reloads. `sound-from-seed` is only a modern deterministic capture alias and is excluded from authoritative source-runtime coverage.
- Spanish visual status: `source-shared-untranslated`; source pixels are preserved, not translated. Audio localization is unresolved.

## Asset Strategy

`asset-inventory.csv` records the preserved SWF, main display sprite, text/font resources, embedded bitmap-backed drawing resources, and both streamed-audio sprites. The checked-in Canvas adapter is deterministically generated from hash-bound FFDec exports and contains embedded data URLs; it does not fetch remote assets. The two extracted MP3 files live under `public/flash-assets/courses/course-g03-l06-ti-001/audio/`; `audit/extracted-audio-assets.json` and the adjacent public manifest bind their source SWF, structural XML, extraction script, byte lengths, sample counts, and SHA-256 values. No source asset under `source-assets/` is edited, transcoded, recompressed, or replaced.

## Implementation Map

- Product route: `/animations/course-g03-l06-ti-001` (locale-prefixed by the Next.js host).
- Reference route: `/reference/course-g03-l06-ti-001`, local audit only.
- React renderer: `packages/demos/src/modules/course-g03-l06-ti-001.tsx`.
- Pure state: `packages/demos/src/timelines/course-g03-l06-ti-001.ts`.
- Unit tests: `packages/demos/tests/course-g03-l06-ti-001.test.ts`.
- Generated Canvas asset: `public/flash-assets/courses/course-g03-l06-ti-001/canvas-renderer.js` plus `manifest.json`.
- Registry: `packages/demos/src/animation-registry.ts`.
- Frame domains: `root` (10 structural frames) and `sprite-21` (142 content frames); both are one-indexed.
- Capture query: `?frame=`, `?frameDomain=`, `?scenario=`, `?lang=`, `?seed=`, `?requirementId=`, `?trace=`, and `?entryStateSha256=`.
- Capture rule: the real visual stage may report `data-flash-frame` only when its requested drawing is ready, and must echo the full requirement/trace/entry-state identity. Loading or error Canvas states are never capture-ready.
- Standalone package: not requested for this phase.

## Verification Evidence

- Unit and type tests exercise one-indexed bounds, both implementation outcomes, source-exact frame-5 request, unresolved post-request phase, frame-137 removal, root structural addressing, Spanish source-pixel preservation, generated-asset safety/hash binding, scenario/seed audio selection, late-frame offsets, cue stopping, rewind, and Replay reset.
- Static frame-domain evidence and disposition are reproducible and hash-bound; current TI disposition is two declared domains, two composite children, zero unresolved visual domains.
- Current candidate product QA passes all 14 fail-closed assertions: native deterministic visual identity, mobile layout, reduced motion, accessibility basics, Replay pointer/Enter/Space, localhost-only diagnostics, both MP3 disk/HTTP byte hashes, modern sound-0 start/stop/Replay reset, and seed-odd selection of sound-1. The mocked `HTMLAudioElement` state-machine check is implementation evidence only—not listening, original-runtime synchronization, or parity evidence.
- Current JavaScript implementation capture: complete for all six declared requirements (588 native-stage PNGs); non-authoritative and not a substitute for the missing original-runtime baseline.
- Strict paired full-frame comparison against authoritative original frames: pending.
- Per-frame RMSE and diff images against a lossless authoritative baseline: pending.
- Byte-exact audio extraction and modern runtime wiring: machine-verified; strict acceptance effect remains none.
- Authoritative audio listening/synchronization and historical Replay behavior: pending.
- Human review of all required diffs: pending.
- Owner acceptance: pending.

## Exceptions And Decisions

1. Blocking: no lossless authoritative natural-runtime baseline exists.
2. Blocking: the frame-14 engineering probe has an unresolved background mismatch and is not RMSE-eligible.
3. Blocking: two embedded MP3 streams are restored and wired to the modern branches but remain language-undetermined and unheard in an authoritative session; synchronization, stopping, and Replay parity are not accepted.
4. Blocking: the requested Spanish view is source-shared but untranslated; original Spanish host routing is unproved.
5. Blocking: original parent-shell entry, untouched random outcome sessions, and historical Replay behavior are not captured.
6. Blocking: complete all-frame/all-scenario metrics, human visual review, engineering review, and owner review are absent.
7. Decision: `?seed=` exists solely for repeatable modern engineering captures and cannot satisfy the source `random(2)` obligation.

## Completion

- Migration status: `preserved`; not strict-complete.
- Engineering reviewer/date: pending.
- Human full-diff reviewer/date: pending.
- Current JavaScript output approval: renewed by the project user on 2026-07-22 and bound to the current artifact set in `reports/current-javascript-output-human-approval.json`; it is scope-limited and does not satisfy strict all-diff human review or owner acceptance.
- Owner review: pending; the user's message did not explicitly establish owner authority.
- Strict validator: expected to remain failing until every blocking item above has hash-bound evidence and signed review.
