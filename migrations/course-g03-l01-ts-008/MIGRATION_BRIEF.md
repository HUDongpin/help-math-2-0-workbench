# course-g03-l01-ts-008 Migration Brief

Created: 2026-07-20

## Objective

Recover Grade 3 Lesson 1 Practice Test Question 2 as a maintainable Next.js module while preserving the original 800×600 coordinate system and explicitly accounting for every source-observed answer, feedback, scoring, glossary, popup, language, audio, completion, and Replay obligation. This work package currently contains an engineering visualization candidate only; unresolved host-dependent states fail closed.

## Identity And Classification

- Immutable `assetId`: `swf-9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b`
- Placement `animationId`: `course-g03-l01-ts-008`
- Collection / placement: course, Grade 3, Lesson 1, TS (Practice Test), page 8
- Raw/reviewed title: `Question 2`
- Knowledge point: English `Question 2`; Spanish `Pregunta 2`
- Controlled domain: `assessment`; lesson topic `Place Value`
- Classification: confirmed from `HELP_COURSES/ELMGR3/L1/index.xml` plus the exact source path; implementation confidence remains low because the FLA and host runtime contract are missing.
- Alias/variant: none recorded.

## Source Evidence

- FLA: unavailable; the catalog records `pairedFlaStatus: missing`.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/TS/L1TS08.swf`
- Source owner/provenance: owner-provided frozen HELP Math archive; source files were not modified.
- SWF SHA-256: `9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b`.
- Matching external audio: `SA/L1TS08.mp3`, SHA-256 `e81753a65c066c3b0112abf7dda689712a15aa022c8cc5ee7b4e38724c9fb734`.
- Missing evidence: authoring FLA, authoritative original course-shell trace, exact language/audio cue map, and complete reachable question-state traversal.
- Evidence boundary: FFDec Canvas output supplies source-derived drawing functions only. The Adobe local-frame controller remains an unexecuted engineering fixture and is not a baseline.

## Runtime Audit

- SWF: CWS version 6, AS1/2, native stage 800×600, 12 FPS, root timeline 10 frames, background `#b8d8f7`.
- Main placed content: root label `begin` at frame 6, instance `animation`, object/sprite 348, 747 local frames, placement `(8247,5658)` twips.
- Local control frames: 295, 434, 550, 659, 728, 729, and 747; the first authored stop is frame 295.
- Complexity: 86 exported scripts, 50 DoAction tags, 30 DefineButton2 tags, 52 morphs, 10 DefineFont2 tags, 1,200 nested ShowFrame tags, and extensive parent/root/global dependencies.
- Host obligations: correct and wrong feedback, retry count, forced continuation, score updates, glossary/hyperlink calls, popup state, parent continuation, completion, and Replay.
- Hash-bound host-function audit: `audit/host-function-binding.json` verifies the preserved child button handlers and the same-lesson `index_local.swf` function bodies. It proves the static call chain into `showRightFeed`, `showWrongFeed`, quiz-button enable/disable, `DoHyperLinks`, Spanish-audio availability/playback, and shell reload-based Replay. It also proves that right/wrong feedback selects `random(4)`/`random(3)` variants; the seed mapping, natural display-list state, retry/score effects, Spanish glossary protocol, synchronization, terminal state, and full Replay reset remain unresolved.
- Audio: 12 embedded streaming timelines plus the external MP3. The inventory records hashes, encoding, durations/sample counts where derivable; language identity, cue frames, listening, and synchronization remain unresolved.
- No legacy endpoint, JavaScript bridge, storage, or remote-resource behavior is executed by the candidate.
- Audit tools: JPEXS FFDec 26.2.1, swfmill 0.3.6, FFmpeg 8.1.2, and the hash-pinned Adobe fixture factory. FLA authoring confidence is unavailable; runtime/interaction/audio confidence is low.
- Source-shared visual finding: the complete FFDec ActionScript export has no English/Spanish/language/lang branch, the SWF has no dynamic EditText, and the course XML routes both `Question 2` and `Pregunta 2` shell labels to this same SWF. The generated `audit/bilingual-visual-source-disposition.json` therefore permits identical untranslated source pixels in `en` and `es`; it does not prove a Spanish translation, audio, host behavior, or parity.

## Baseline

- Authoritative baseline: blocked. No authorized lossless original-runtime capture exists for sprite-348 local states.
- Ruffle route: `/reference/course-g03-l01-ts-008`, for local forensic use only; it is not production or fidelity proof.
- Adobe fixture: targets local frame 295, mutes audio, blocks input/network, and is hash-pinned, but has not produced an accepted lossless frame trace.
- Candidate capture environment: Chromium 150.0.7871.129, device scale 1, native 800×600 stage.
- Candidate keyframes 1, 295, 434, 550, 659, 728, and 747 cover initial, authored-stop, feedback/progression, popup, answer, and terminal structural states. They are implementation inspection images, not baseline pairs.
- Without baseline pairs, normalized RMSE and visual parity remain unmeasured.

## Rendering Decision

- Selected renderer: React host plus a deterministic Canvas adapter generated from the hash-pinned FFDec sprite-348 drawing export.
- Rationale: the content has hundreds of morph/vector/button drawing functions and 747 local frames; Canvas preserves the source coordinate system without executing AVM1.
- Safety: the generated 9,026,835-byte runtime has an explicit 310-function allowlist, 13 embedded data-image variables, no dynamic evaluation, no timers/autoplay, no network primitives, no storage, and no ambient DOM listeners.
- Rejected approaches: Ruffle is reference-only; video would discard required interaction; a hand-redrawn SVG would add unjustified visual inference before a baseline exists.
- Accessibility/localization: the stage has an accessible name and responsive wrapper; player Replay supports pointer, Enter, and Space; reduced motion freezes at frame 295. English and Spanish route contexts render identical untranslated source pixels for `root-standalone` and `source-drawing-default`. All unproven host scenarios continue to show explicit unavailable states and do not load the Canvas asset.

## Timeline Specification

The public candidate frame domain is the one-indexed local sprite range 1…747, not the ten-frame root preloader shell. It maps local frame `n` to FFDec export frame `n-1`, pins the source root to frame 6, and renders with stage offset `(-834.25,-367.1)`. Candidate playback advances only to the first authored stop at frame 295. Seed is normalized and recorded but does not claim a source branch.

`source-drawing-default` is the only nested rendering scenario. It renders the same source drawing for `en` and `es`; the standalone root frames likewise render unchanged for both requested language contexts. The source obligations `answer-correct-unavailable`, `answer-first-wrong-unavailable`, `answer-second-wrong-unavailable`, `glossary-popup-unavailable`, and `completion-scoring-replay-unavailable` all fail closed with their corresponding host-state blocker in both languages. No audio cue is exposed, and every returned frame state retains `audioRendered: false`.

## Asset Strategy

`audit/canvas-adapter-spec.json` pins the SWF, scenario/audio audits, hash-bound bilingual visual disposition, FFDec helper, 747-frame HTML export, placement transforms, drawing-function inventory, and embedded images. `scripts/build-safe-ffdec-canvas-adapter.mjs` generates `public/flash-assets/courses/course-g03-l01-ts-008/canvas-renderer.js` and its safety manifest. No source asset was edited, and no screenshot was substituted for editable drawing data.

## Implementation Map

- Next.js route: `/en/animations/course-g03-l01-ts-008` and `/es/animations/course-g03-l01-ts-008`.
- React component: `packages/demos/src/modules/course-g03-l01-ts-008.tsx`.
- Pure timeline/state: `packages/demos/src/timelines/course-g03-l01-ts-008.ts`.
- Unit tests: `packages/demos/tests/course-g03-l01-ts-008.test.ts`.
- Ruffle reference: `/reference/course-g03-l01-ts-008`, local audit only.
- Standalone package: not requested/generated.
- Deterministic contract: `?frame=`, `?scenario=`, `?lang=`, `?seed=`; the stage reports exact local frame through `data-flash-frame` and domain through `data-flash-frame-domain="sprite-348"`.

## Verification Evidence

- Targeted tests: TS008 module 12/12, including exhaustive pure-state checks across all 747 local frames in both languages and every blocked interaction scenario; hash-bound bilingual disposition 3/3, hash-bound same-lesson host-function binding 4/4, TS008 adapter contract 1/1, and shared course-candidate QA contract 18/18 passed; demos registry freshness and TypeScript check passed. Full repository regression/build are intentionally deferred to the root acceptance run.
- Safe adapter regeneration and `--check`: passed; output SHA-256 `77373bbb8f8511fd657048341507eea5bac314ff112d3ca35f339eefc1a84fac`.
- Candidate keyframes: seven 800×600 frames with exact `data-flash-frame`, no console errors, failed requests, HTTP errors, or unexpected requests. Capture manifest SHA-256 `d3844bbd60f10098a06ab7fc5a9a8a0ea0b23d574910d5f508a5d7d56d3badd6`.
- Current browser candidate QA: Chromium 149.0.7827.55, 12/12 assertions passed; the hash-bound report is `evidence/nextjs-native-candidate-qa.json`, SHA-256 `e3e4138b6dbc972543e0d4de5c29293410e64a5173f7cce82ebae9af31f71486`. It verifies the Spanish source-shared untranslated Canvas at frame 295 with audio unrendered, all five host scenarios fail closed, and no console, page, HTTP, failed-request, or off-host-network error.
- Product QA: normal 390×844 layout has document width 390 and responsive stage 346×259.5; native backing canvas remains 800×600.
- Replay: modern player counter advanced for pointer, Enter, and Space. This proves only the modern candidate control, not source terminal Replay.
- Reduced motion: frame 295 remained stable across 1,200 ms.
- Source-shared visual: Spanish `root-standalone` and `source-drawing-default` now render the exact same untranslated source pixels as English. This is current-JavaScript behavior only and adds no baseline, RMSE, translation, audio, review, or completion claim.
- Fail closed: all five host scenarios in both languages render no Canvas and preserve their scenario-specific blocker.
- Renderer-domain audit: all 28 TS008 probes preserve exact frame-domain/frame/scenario/language identity; 8 source-shared root/default probes are renderable and the 20 interaction probes remain explicitly blocked. The sprite domain is therefore not fully renderable.
- Static host-function bodies prove the child-to-host call names, but randomized feedback selection, retry/scoring state, glossary localization, audio execution, terminal state, and Replay reset still lack original-runtime execution evidence. The exhaustive pure-state test therefore keeps every affected frame/scenario blocked rather than promoting static ActionScript into behavioral proof.
- Network: all observed requests were same-origin; generated asset CSP sets `connect-src 'none'`; console errors/warnings were zero.
- Full-frame baseline coverage, per-frame RMSE/diffs, production build, human review, and owner review remain pending.

## Exceptions And Decisions

- Blocking: missing FLA and missing authorized original-host baseline.
- Blocking: all answer/feedback/retry/score/glossary/popup/completion/source-Replay branches require unresolved host state.
- Blocking: all embedded/external audio is omitted pending authoritative mapping, listening, cue, synchronization, and Replay validation.
- Blocking: Spanish translation and every audio cue/listening/synchronization/Replay claim remain unavailable; only the identical untranslated source visual is exposed.
- Blocking: no authoritative all-frame/all-scenario comparison, RMSE, human diff review, engineering acceptance, or owner acceptance exists.
- The seven-frame Canvas review is explicitly candidate evidence and has no strict acceptance effect.

## Completion

- Engineering reviewer: pending named reviewer; Codex performed bounded implementation/QA only.
- Review date: pending.
- Owner review: pending; no owner decision has been inferred.
- Strict validator: not eligible. Migration remains `preserved`, and the public strict library must not expose it.
