# course-g05-l13-rw-002 Migration Brief

Created: 2026-07-20

## Objective

Restore the Grade 5 Geometry “Your World” page as a deterministic Next.js animation while preserving the supplied English embedded stream, the host-routed Spanish narration, the source press-to-continue transition, terminal stop, and Replay semantics. The current implementation is an engineering candidate only; it must continue to fail closed where the original runtime has not been naturally traversed.

## Identity And Classification

- Immutable `assetId`: `swf-bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6`
- Placement `animationId`: `course-g05-l13-rw-002`
- Collection, grade, lesson, section, and page: course / Grade 5 / Lesson 13 / RW / page 2
- Raw and display title: `Page 1`
- Knowledge point: English `Page 1`; no authoritative Spanish knowledge-point title is present.
- Controlled mathematics domain: geometry and coordinates
- Classification evidence/status: confirmed from `ELMGR5/L13/index.xml` and the preserved source path.
- Alias or variant relationship: none recorded.

## Source Evidence

- FLA: unavailable; this is a SWF-only pilot.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf`
- Source owner/provenance: owner-provided HELP Math archive, preserved read-only.
- SWF SHA-256: `bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6`.
- Exact Spanish host track: `SA/L13RW02.mp3`, SHA-256 `2e809c69df60cec11427a71d38b37b830a0a9ec805e3c8ff4f68734cb53bfcd2`.
- Missing source: paired FLA. No visual or behavioral fact is inferred from an unavailable FLA.
- Evidence conflict: none resolved; static SWF/host evidence and runtime evidence retain separate authority boundaries.

## Runtime Audit

- SWF signature/version: CWS, version 6, declared length 5,181,454 bytes.
- Stage: 800×600; background `#b8d8f7`.
- Root timeline: 12 FPS, 10 one-indexed frames, 833.333 ms. Main `sprite-334` is placed at root frame 6 and has 1,873 local frames.
- ActionScript: AVM1/AS1-2; five `DoAction` tags across six exported script files.
- Assets: 11 `DefineMorphShape` tags; no audited masks, filters, or embedded fonts in the manifest.
- Audio: one 1,870-block MP3 SoundStream in `sprite-334` (155,611 ms, language unconfirmed) plus exact host-routed Spanish MP3 `SA/L13RW02.mp3` (26,544 ms). There is no guessed root cue frame.
- Audio implementation: the Spanish MP3 is copied byte-for-byte to `/flash-assets/audio/courses/course-g05-l13-rw-002/es.mp3` as a hash-bound staged asset, but the product control remains withheld. The source host resumes the child only in an eligible nonterminal state and also resets feedback clips; a generic play/pause button is not behaviorally equivalent. Spoken-content listening, child pause/resume synchronization, terminal behavior, and Replay remain unaccepted.
- Stops/interactions: local stop at frame 673; source button 111 issues `play()` and transitions to 674; terminal stop at 1873. Natural traversal and Replay are still missing.
- Network/external calls: no approved network behavior; legacy side effects remain denied by the capture fixtures.
- Tools: FFDec 26.2.1, swfmill evidence, FFmpeg/ffprobe 8.1.2, and Adobe Flash Player Projector 32.0.0.414 as recorded in the bound audits.
- Confidence: source identity and static structure high; natural reachability, spoken content, synchronization, terminal state, and Replay unresolved.

## Baseline

- Authoritative evidence currently covers only all ten standalone root frames from Adobe Flash Player 32.0.0.414.
- Native viewport: 800×600 at device scale factor 1.
- Capture method: lossless deterministic-step root capture. It does not prove natural entry into `sprite-334`.
- Required nested capture: every naturally reached local frame 1–1873, including the press at 673, frame 674 continuation, terminal stop, both language/audio paths, and separate Replay evidence.
- Ruffle and FFDec Canvas output are forensic/engineering references only, not authoritative runtime parity.

## Rendering Decision

- Selected renderer: React host plus a deterministic Canvas adapter generated from the hash-bound FFDec drawing export.
- Rationale: the main timeline is large and morph/vector dense; Canvas retains source drawing order while the pure TypeScript timeline owns identity and fail-closed state.
- Rejected: SVG re-authoring would add unnecessary manual reconstruction risk; Ruffle and video cannot be production implementations.
- Accessibility/localization: native responsive 4:3 wrapper, semantic status messages and Replay control, and deterministic language identity. Complete child ActionScript, the original-host entry contract, and the source manifests now support rendering the same untranslated source pixels in `en` and `es`; this does not provide a Spanish translation or bilingual parity. The Spanish audio control remains withheld until original-host listening and synchronization evidence proves the complete host state.

## Timeline Specification

Root frames 1–10 and `sprite-334` frames 1–1873 are independently addressable as the same untranslated source visual in `en` and `es`. At 673, source button 111 is active and `quizSection` is true; its press issues `play()`, removes the control at 674, and clears `quizSection`. Directly addressing frames 674–1873 does not prove that natural click traversal, terminal behavior, or Replay. The Spanish host track is user-triggered rather than assigned a guessed timeline frame.

Declared scenarios are `root-standalone` and nested `default`, seed 0, in English and Spanish. Natural-trace specifications exist for both nested languages. Replay and audio are separate traces/gates and remain pending.

## Asset Strategy

`asset-inventory.csv` binds the FFDec sprite export, the local no-AVM1 Canvas adapter, the source-shared bilingual visual disposition, the ten byte-identical root PNGs, and the byte-identical staged Spanish MP3. The Canvas adapter accepts `en` and `es` but preserves the same untranslated source pixels. The MP3 is not exposed by the current animation module because the source host's conditional resume/reset behavior is unresolved. No flattened nested baseline or synthesized audio is treated as source evidence.

## Implementation Map

- Next.js route: `/animations/course-g05-l13-rw-002`
- React component: `packages/demos/src/modules/course-g05-l13-rw-002.tsx`
- Pure timeline: `packages/demos/src/timelines/course-g05-l13-rw-002.ts`
- Tests: `packages/demos/tests/course-g05-l13-rw-002.test.ts`
- Reference route: `/reference/course-g05-l13-rw-002` (local audit only)
- Standalone package: not requested.
- Capture contract: `frameDomain`, `requirementId`, `trace`, `entryStateSha256`, `frame`, `scenario`, `lang`, and `seed`; the stage reports matching `data-flash-*` identity.

## Verification Evidence

- Unit tests: module/timeline/source/public-asset tests pass; this does not replace runtime validation.
- Production build and structural candidate QA have passed previously but must be rerun after the final evidence bindings stabilize.
- Root captures: 10/10 authoritative standalone English frames. The modern route reuses those source pixels for `es` without translation. Nested authoritative original-runtime capture remains 0/1,873 in each required natural language trace; the already captured 1,873-frame English JavaScript output is implementation-only, and no Spanish full-frame JavaScript capture is adopted by this increment.
- RMSE: no accepted nested original-runtime comparison yet.
- Replay, keyboard, responsive, console/network, human diff review, and owner review remain strict blockers unless explicitly evidenced by current receipts.

## Exceptions And Decisions

- Paired FLA is missing.
- A fresh disposable macOS VM snapshot or one-time OS login with a genuinely empty Flash profile is required for promotable original-host natural captures; the current-account sandbox launcher is rehearsal-only.
- Natural traversal into frames 674–1873, terminal behavior, Replay, embedded-stream language/content, Spanish spoken content, and pause/resume synchronization are unresolved; deterministic source-drawing addressability is not behavior parity.
- No human visual review, engineering acceptance, or owner acceptance is recorded.

## Completion

- Engineering reviewer/date: pending.
- Owner review: pending.
- Strict validator: not passed; migration remains `preserved`.
