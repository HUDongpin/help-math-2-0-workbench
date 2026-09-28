# course-g04-l03-ti-004 Migration Brief

Created: 2026-07-24

## Objective

Describe the instructional purpose, target users, required languages, interactions, and exact stakeholder request.

## Identity And Classification

- Immutable `assetId` (`swf-<full SHA-256>`):
- Placement `animationId`:
- Collection, grade, lesson, section, and page:
- Raw title and reviewed display title:
- Knowledge point in English and Spanish:
- Controlled mathematics domain:
- Classification evidence, status, and confidence:
- Alias or variant relationship:

## Source Evidence

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI04.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI04.swf`
- Source owner/provenance:
- SHA-256 values:
- Missing source files:
- Evidence conflicts and resolution:

## Runtime Audit

- SWF signature/version:
- Stage width and height:
- Frame rate, frame count, duration:
- Background/transparency:
- ActionScript generation and scripts:
- Symbols, masks, morphs, filters, blend modes:
- Embedded fonts and exact strings:
- Audio/video:
- Audio cue IDs, language tracks, hashes, durations, and start frames (`audio-inventory.csv`):
- FlashVars, URLs, external assets, and legacy APIs:
- Stops, labels, buttons, Replay, and user interactions:
- Audit tools and exact versions:
- Confidence by audit area:

## Baseline

- Authoritative runtime or renderer:
- Ruffle/Animate/browser version:
- Native viewport and device scale factor:
- Capture method:
- Required keyframes and why they matter:
- Known emulator differences:

## Rendering Decision

- Selected renderer: React + SVG / Canvas + CreateJS / Canvas + PixiJS / other
- Why it fits this animation:
- Rejected alternatives and tradeoffs:
- Accessibility and localization approach:

## Timeline Specification

Summarize object phases, one-indexed frame windows, transforms, alpha, depth, text/count changes, audio cues, and interaction transitions. Keep the full frame list in `keyframes.csv`.

List every reachable scenario/branch, its deterministic seed, and its terminal/Replay state. Every scenario and language must receive full one-indexed frame coverage.

## Asset Strategy

Summarize extracted, converted, redrawn, and generated assets. Record each item in `asset-inventory.csv`, including source character/symbol IDs and transformation notes.

## Implementation Map

- Next.js route:
- React component:
- Pure timeline module:
- Unit test file:
- Ruffle reference route:
- Standalone package:
- Deterministic `?frame=` capture mode:
- Deterministic `?scenario=`, `?lang=`, and `?seed=` modes:
- Mandatory stage attribute `data-flash-frame`:

## Verification Evidence

- Unit tests:
- Production build:
- Native-size keyframe captures:
- Full-frame coverage manifest and archive:
- Per-frame metrics files and checksums:
- RMSE and diff-image results:
- Replay and keyboard checks:
- Desktop/mobile overflow checks:
- Console and network checks:
- Human reviewer and review date for all keyframe/full-frame diffs:

## Exceptions And Decisions

List every unresolved mismatch, unavailable tool/source, accepted emulator difference, owner decision, and follow-up. Do not leave this section blank; write `None` when there are no exceptions.

## Completion

- Engineering reviewer:
- Review date:
- Owner review status:
- Owner decision, reviewer/date, or explicit not-required reason:
- Strict validator result:


## 2026-09-08 Modern Product Follow-up — TI004

This bounded advanced-manual follow-up reviews whole-lesson page 26, Try It Question 3. It preserves the original seven source cards and target mapping. The values sort as −11 < −10 < −4 < −1 < 0 < 4 < 6. Empty targets expose only their slot number, not the correct value. Root placement (412.4, 283.3), Sprite274 live frame124 and clean drawing122 remain bound to the existing source evidence. No source FLA/SWF, generated Canvas, audio or dictionary file was edited.

The maintained modern renderer now declares activity completion and completes only after all seven cards and the last correct-feedback interval. The original 19/12-second current-JS feedback projection is retained and paused by host Pause. Replay resets the attempt. Mobile results now remove the original card and reveal it at its source target. Completed answers remain visible; the final notice sits below the image, and the short feedback badge sits below the remaining cards. The question header is shifted below the modern content crop.

The read-only glossary audit finds nine button definitions, but only eight keys have main/help placement evidence: main Order/Least/Greatest and Help Value/Negative number/Decrease/Positive number/Increase. Value's two help instances use one companion button. The separate Decimal button is inside exported symbol toptxt (Sprite148), with no source display-list reference other than Export and no literal toptxt use in the extracted scripts. Its runtime reachability is not established, and no learner button is added solely because the definition exists. Help Sprite271 is placed as Mc_Popup at frame124 and starts hidden. Modern help terms are rendered only while that help state is open, English controls are enabled, and Canvas is ready. Typed Key Terms requests retain exact EN/ES IDs and reversible support pause; legacy scripts are not executed.

Original help sentences remain in source metadata. The learner explanation clarifies the missing direction: 'Values decrease to the left.' and 'Values increase to the right.' A maintained SVG number line from −10 to +10 includes zero and 21 equal unit ticks, with five major labels on narrow screens. This is modern teaching clarification, not source pixel parity. Help and error dialogs support Escape and Tab containment with focus returned to the original control.

The special Sprite273 frame1 diagnostic path, its custom getFrameState, default scenario, parent-composite frame124 and placement-audit hash are preserved. Deterministic main-frame evidence also keeps its requested drawing and disables modern controls. These are source-static diagnostic contracts, not original runtime or fidelity evidence.

Evidence: `work/g4-l3-modern-product-review/20260908-try-it-ordering/REVIEW.md`. Targeted tests include all 5,040 answer orders, exact source geometry, wrong/locked/repeated input, Replay, help locking, unsupported contexts, original capture paths and glossary timing. Browser checks exercise desktop/mobile, real dragging, keyboard input, wrong retry, help/glossary return and completion. Source SWF/FLA/XML plus two Web audio byte bindings are freshly verified. An existing browser tab crashed after hot updates; the known local course was reopened in a new tab in the same browser, retaining page26. Its cause is not established. The source server was not restarted.

Owner approval, original runtime, audio listening/synchronization, human visual acceptance, strict completion, the separate frozen16-page calibration batch, publication and deployment remain independent. Registration remains39 existing active pages; no new registration or Owner approval is recorded.
