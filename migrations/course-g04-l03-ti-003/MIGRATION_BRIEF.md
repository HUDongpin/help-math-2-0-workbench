# course-g04-l03-ti-003 Migration Brief

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

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI03.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI03.swf`
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


## 2026-09-08 Modern Product Follow-up — TI003

This bounded advanced-manual follow-up reviews whole-lesson page 25 (Try It Question 2) inside the retained modern My Lesson host. The source-static Canvas assets and source FLA/SWF remain unchanged. The maintained state machine preserves the six source mappings: Scr_1 −10 → Mc_Tar_1, Scr_2 +9 → Mc_Tar_2, Scr_3 +1 → Mc_Tar_3, Scr_4 −2 → Mc_Tar_4, Scr_5 −7 → Mc_Tar_5, Scr_6 +5 → Mc_Tar_6. Source-derived geometry stays at root placement (412.4, 283.3); live frame 139 uses clean drawing 138. Deterministic evidence requests retain their exact requested frame and exclude these interaction and glossary overlays.

The module now uses activity completion; entering the question or completing only five cards does not finish the current attempt. Normal correct feedback, including the sixth card, keeps its existing 20/12-second engineering projection and respects host Pause/Resume. Replay resets the attempt. Mobile answers now remove the source card and display it at the corresponding number-line target. Completion text sits below the line. The modern page shifts the authored question below the shared content crop.

Eight source button definitions resolve to seven distinct glossary keys. Four main-timeline visibility segments expose Position and Number line. The six Sprite-125 terms are exposed only in the frame-139 Need More Help state, respecting the source Mc_Popup visibility condition. Typed requests retain the exact language-specific entry IDs and reversible host support pause. No AVM1 or legacy DoHyperLinks code is executed. Help retains the exact source sentence and uses a maintained, zero-inclusive number line with 21 equal unit ticks from −10 to +10. The added zero and increasing-right explanations are modern teaching clarification, not a claim about original pixels. Help and wrong-feedback dialogs support Escape and Tab containment with focus returned to their trigger.

Validation and bound evidence: `work/g4-l3-modern-product-review/20260908-try-it-number-line/REVIEW.md`. Existing tests cover all 720 placement orders, wrong/duplicate/locked states, source geometry, Replay, unsupported contexts, exact-frame evidence isolation, custom EN event audio and ES track preservation, and glossary frame visibility. Browser checks cover normal playback, actual pointer dragging, keyboard input, wrong retry, both responsive surfaces, 48px mobile controls, glossary returns, completion and paused feedback. SWF, FLA, source XML and the two Web audio files are freshly hash-verified. Audio byte/routing checks are not listening or synchronization acceptance.

This is engineering review only. Original-runtime playback, audio listening, human visual and Owner acceptance, strict completion, the separate frozen 16-page calibration batch, lesson publication and deployment remain independent. The 39 active pages were already registered; no new registration or Owner approval is added.
