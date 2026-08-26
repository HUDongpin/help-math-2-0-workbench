# course-g04-l09-gs-002 Migration Brief

Created: 2026-07-20; root source-shared untranslated visual disposition updated 2026-07-23

## Objective

Recover Grade 4 Lesson 9 Play It Game 1 as a maintainable Next.js module while preserving the 800×600 coordinate system and explicitly accounting for the ten questions, fourteen button targets, random order, answer feedback, score, glossary, course routing, bilingual audio, Final, and Replay obligations. This work package currently contains a source-drawing engineering candidate only; every unproven game/host state fails closed.

## Identity And Classification

- Immutable `assetId`: `swf-41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15`.
- Placement `animationId`: `course-g04-l09-gs-002`.
- Collection / placement: course, Grade 4, Lesson 9, GS (Play It), page 2.
- Raw/reviewed title: `Game 1`; lesson topic `Equations`.
- Controlled domain: `expressions-equations-number-theory`; classification confirmed from the active lesson XML and exact source path.
- Alias/variant: none recorded. Implementation confidence remains low because the FLA and original host fixture are unavailable.

## Source Evidence

- FLA: unavailable; catalog `pairedFlaStatus` is `missing`.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf`, owner-provided, SHA-256 `41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15`.
- Same-lesson host: `index_local.swf`, SHA-256 `e725af1cfac54d111c948df412a81d2ef02110d242361147cca5ef13b78e2ed5`; active course XML: `index.xml`, SHA-256 `d1d3bdba357f66e252d6201b00cffeed409ea4505233595cedf1f5bfd10722b4`.
- External Spanish audio: `SA/L9GS02.mp3`, SHA-256 `fc1d611959deedae1d0ac4005b09c416fbd1711536c3190d190795798a4ad9d3`, 44,544 ms; spoken content and synchronization have not been authoritatively listened to.
- Complete FFDec script export: `audit/machine/ffdec-scripts.txt.gz`, SHA-256 `eb6a87a913b2d9d88f8aef8dbffb3623d3f3dcaac2c38569144fef532a595b72`; its 66 script blocks contain no `English`, `Spanish`, `language`, or `lang` branch.
- Missing evidence: authoring FLA, deterministic original parent/root/global fixture, original course-shell traversal, exact hit geometry, and complete branch/audio traversal.
- Evidence boundary: `audit/bilingual-visual-source-disposition.json` binds the SWF, same-lesson host, active XML, Spanish MP3, complete scripts, scenario inventory, structural root report, and all ten 800×600 root PNGs. It permits those fixed root pixels to render unchanged in en/es request contexts as `source-shared-untranslated-visual` only. FFDec executed no ActionScript, the output is not a Spanish translation or original-runtime baseline, and the sprite-787 Canvas adapter deliberately remains English-only. Adobe Flash Player standalone captured only blank root frames 1–4 before controls disabled; it is partial root evidence and not a sprite-787 all-state baseline. Ruffle is reference-only.

## Runtime Audit

- SWF: CWS version 6, AS1/2, native stage 800×600, 12 FPS, ten-frame root, background `#b8d8f7`.
- Root label `begin` at frame 6 places `animation`, sprite/object 787, at `(8388,5266)` twips. The local sprite has 653 frames.
- Local control states: `GS_Begin` stop at 642; Q1–Q10 stops at 643–652; `Final` stop at 653. The candidate stops at 641 because frame 642 executes AVM1 initialization and visibility changes that the static adapter does not execute.
- Interaction obligations: 14 button definitions; Start/Repeat/answer controls; correct and wrong feedback; randomized ten-question order; score/progress; popup/glossary; course navigation; terminal and source Replay.
- Visual complexity: 763 allowlisted drawing functions, 10 embedded images, morphs, nested sprites, fonts/text, and multiple color/matrix transforms.
- Audio: 12 embedded MP3 streaming timelines plus the external Spanish MP3. Local stream frames are known structurally; runtime cue mapping, language/content, listening, synchronization, stop/loop, and Replay are unresolved.
- No legacy endpoint, JavaScript bridge, persistent storage, timer, or remote-resource behavior is executed by the candidate.
- Tools: JPEXS FFDec 26.2.1, swfmill 0.3.6, FFmpeg 8.1.2, Adobe Flash Player 32.0.0.414 partial standalone trace, and Chromium 149.0.7827.55. FLA authoring confidence is unavailable; interaction/audio/runtime confidence is low.

## Baseline

- Authoritative local-frame/all-state baseline: blocked. The four Adobe standalone captures cover root frames 1–4 only and are identical blank-stage images; stepping stopped before the content root frame.
- Structural root inspection: FFDec-exported root drawings 1…10 are byte-verified, copied to the local product asset tree, and directly addressable unchanged in English and Spanish request contexts. This establishes implementation addressability only; it supplies no Spanish translation, original-runtime, natural-playback, AVM1, audio, RMSE, human-review, or owner-acceptance evidence.
- Local reference route: `/reference/course-g04-l09-gs-002`; Ruffle is not production and not fidelity proof.
- Candidate environment: Chromium 149.0.7827.55, device scale 1, 800×600 native capture.
- Candidate sample frames 1, 331, and 641 cover the English sprite opening, a structural question overlay, and the pre-stop transition. Frame 642, frames 643/653, every Spanish sprite request, and correct-answer scenarios remain fail-closed UI states. No current JavaScript capture has yet been adopted for the newly renderable Spanish root requirement.
- There are no authoritative baseline pairs, full-frame comparison, RMSE values, or visual-parity claims.

## Rendering Decision

- Selected renderer: React host plus hash-bound FFDec root PNGs for direct structural root inspection and a deterministic Canvas adapter generated from the hash-pinned FFDec sprite-787 drawing export.
- Rationale: hundreds of vector/morph/button functions and embedded images make Canvas appropriate while preserving source coordinates and avoiding AVM1 execution.
- Safety: the 50,073,029-byte adapter uses an explicit 763-function allowlist and 10 embedded data images; it contains no dynamic evaluation, timers/autoplay, network primitives, storage, or ambient DOM listeners.
- Rejected approaches: Ruffle is forensic-only; video would discard interaction; hand-redrawn SVG would introduce unjustified inference before an authoritative baseline exists.
- Accessibility/localization: the stage and controls have accessible names, Replay supports pointer/Enter/Space, mobile layout is responsive, and reduced motion freezes at the last admitted English sprite frame 641. Root frames 1…10 render the same untranslated source pixels for en/es; Spanish sprite frames 1…653 and all unproven branches show explicit unavailable states and do not load the Canvas asset.

## Timeline Specification

The `root-standalone` inspection exposes one-indexed FFDec structural drawings 1…10 for both en and es request contexts while normal root playback remains stopped at frame 1. Both routes receive the same source pixels, explicitly classified `source-shared-untranslated-visual`; no Spanish translation is supplied. This deterministic inspection does not replace the incomplete Adobe/original-runtime baseline.

The public candidate uses one-indexed local sprite frames 1…653 and maps frame `n` to FFDec export frame `n-1`, with source root fixed at frame 6 and stage offset `(-345.4,-488.3)`. `source-drawing-lead-in` renders only frames 1…641. Frame 642 executes source AVM1 that hides `Mc_Popup` and `Robos_1…8` while initializing game globals; because the static adapter executes no AVM1, direct requests for frames 642…653 fail closed.

`questions-q1-q10-unavailable`, `answer-correct-unavailable`, `answer-wrong-unavailable`, `random-scoring-unavailable`, and `final-replay-glossary-routing-unavailable` are explicit blocked scenarios. Spanish overrides every `sprite-787` scenario, including `source-drawing-lead-in` frames 1…641, with `spanish-visual-and-audio-not-source-proven`; root is the only bilingual visual disposition. Seed is normalized and reported but does not drive source random state. No audio cue or host audio track is registered or exposed.

## Asset Strategy

`audit/canvas-adapter-spec.json` pins the source SWF, audits, FFDec helper/export hashes, transforms, function allowlist, embedded images, and unresolved obligations; its `supportedLanguages` remains `["en"]` to prevent a Spanish sprite scope leak. `scripts/build-safe-ffdec-canvas-adapter.mjs` generated the local sprite runtime and manifest. `scripts/build-gs002-root-bilingual-visual-disposition.mjs` generates the fail-closed root-only bilingual disposition. `scripts/build-gs002-ffdec-root-frame-assets.mjs` revalidates that disposition, the preserved SWF, structural report, native dimensions, source PNG bytes, and every hash before creating or checking the ten public root inspection assets with `supportedLanguages: ["en","es"]`. No legacy source was edited, and screenshots are review evidence rather than production artwork.

## Implementation Map

- Next.js routes: `/en/animations/course-g04-l09-gs-002` and `/es/animations/course-g04-l09-gs-002`.
- React module: `packages/demos/src/modules/course-g04-l09-gs-002.tsx`.
- Pure state: `packages/demos/src/timelines/course-g04-l09-gs-002.ts`.
- Unit tests: `packages/demos/tests/course-g04-l09-gs-002.test.ts`.
- Ruffle reference: `/reference/course-g04-l09-gs-002`, local audit only.
- Standalone package: not requested/generated.
- Capture contract: `?frameDomain=`, `?requirementId=`, `?trace=`, `?entryStateSha256=`, `?frame=`, `?scenario=`, `?lang=`, and `?seed=`; the stage and root image report the matching `data-flash-*` identity. Root structural inspection uses `frameDomain=root`; the local candidate uses `frameDomain=sprite-787`.

## Verification Evidence

- Candidate tests and generator checks cover the root-only language scope, source/host/XML/audio/script hashes, all ten PNGs, and the unchanged English-only sprite adapter. On 2026-07-23, the focused GS002 suite passed 11/11, the disposition generator suite passed 3/3, `npm run test:demos` passed 147/147, `npm run typecheck:demos` passed, and `npm run audit:renderer-frame-domains:check` passed. The GS002 renderer audit records 5/28 exact renderable probes (all four root endpoint probes plus the admitted English sprite lead-in endpoint); the remaining 23 probes stay explicitly blocked. Production build and strict acceptance remain part of the root workflow.
- Current deterministic candidate captures cover frames 1, 331, and 641 at 800×600. Frame 642 is now an explicit fail-closed capture because its source script initializes globals and hides `Mc_Popup` plus `Robos_1…8`; the older static frame-642 screenshot remains rejected diagnostic evidence only.
- Modern candidate playback and reduced motion stop at frame 641, the last static drawing that does not require executing the frame-642 AVM1 action. This is a conservative product boundary, not a claim about source natural playback.
- Root-domain direct inspection resolves all ten en/es structural frames while `playbackEndFrameByDomain.root` remains 1. The existing deterministic browser capture records only English under `artifacts/full-frame/pilot-implementation/course-g04-l09-gs-002/req-root-root-standalone-en/`; representative keyframe rows cover frames 1, 5, 6, and 10. Spanish root capture/adoption is intentionally deferred to a separate schema-v4 operation. These are candidate implementation states without an authoritative baseline pair or RMSE.
- The generated root-asset checker binds every public PNG to the FFDec report and ignored archive bytes. Its strict-acceptance effect is explicitly `none`.
- Fail-closed checks cover Spanish sprite endpoints 1, 641, 642, and 653, frame 642 AVM1 initialization, Q1/Final, and every declared game/host scenario; each reports the requested identity, renders no Canvas, and does not load the candidate asset script.
- Product QA: 390×844 layout has no horizontal overflow and uses an 800×600 Canvas backing store. Pointer, Enter, and Space activate the modern reset control. Frame 641 is used for mobile and reduced-motion checks.
- Network: 466 observed dev-route requests were same-origin at `127.0.0.1:3000`; console errors/warnings, page errors, failed requests, HTTP errors, and unexpected requests were all zero.
- Full-frame baseline coverage, RMSE/diffs, production build, human review, engineering acceptance, and owner review remain pending.

## Exceptions And Decisions

- Blocking: missing FLA and missing authoritative original-host/local-frame baseline.
- Blocking: Q1–Q10, 14 button targets, random state, correct/wrong feedback, score, popup/glossary, course routing, Final, and source Replay remain unresolved and fail closed.
- Blocking: all 12 embedded streams and the external Spanish MP3 are omitted from runtime playback pending authoritative listening, cue, synchronization, stop, and Replay validation. The Spanish MP3 remains byte-exact in the source archive and public staging tree but is not registered with the animation module or host controls.
- Blocking: Spanish sprite-787 visuals, translated root visuals, and all Spanish audio remain unavailable and fail closed. Only the same untranslated root source pixels are renderable in the Spanish request context.
- Blocking: no authoritative all-frame/all-scenario comparison, RMSE, human diff review, engineering acceptance, or owner acceptance exists.
- The Canvas samples and product QA are candidate evidence with no strict acceptance effect.

## Completion

- Engineering reviewer: pending named reviewer; Codex performed bounded implementation and QA only.
- Review date: pending.
- Owner review: pending; no owner decision has been inferred.
- Strict validator: not eligible. Status remains `preserved`; the public strict library must not expose this candidate.

<!-- BEGIN GENERATED GS002 PARTIAL CURRENT-JS REQUIREMENT -->
## Supplemental Current-JavaScript Partial Requirement

- Requirement: `req:sprite-787:source-drawing-lead-in:en:partial-frames-1-641`; schema v2, `coverageRole: partial-path`, group `coverage-group:sprite-787:source-drawing-lead-in:en:seed-0`.
- Physical selection: sprite-787 frames 1–641 of the immutable 1–653 domain; selection SHA-256 `1d9fccdc8c163fefef7b966875d9858f043a13ac4727e3f41d4e5bec16990bb6`.
- Frames 642–653 remain explicitly unresolved: Frames 642 through 653 require AVM1 initialization, question/final state, and host behavior that the static source-drawing adapter does not execute.
- Specification audit: `audit/partial-current-js-requirement.json`, SHA-256 `d62646f0f7d285288944acfe38c5add16be254f614df367cce180c13f38b1a60`.
- Authority boundary: current-JavaScript capture only. Original-runtime baseline, RMSE acceptance, human visual review, owner acceptance, and strict acceptance are all false; strict-acceptance effect is `none`.
- The canonical 1–653 source-drawing requirement remains separate, unchanged, blocked, and in the canonical strict denominator. This supplemental row is excluded from keyframe mapping and strict completion.
<!-- END GENERATED GS002 PARTIAL CURRENT-JS REQUIREMENT -->
