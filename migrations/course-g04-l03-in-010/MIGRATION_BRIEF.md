# course-g04-l03-in-010 Migration Brief

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

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN10.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN10.swf`
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

## 2026-09-08 modern-product temperature follow-up

- Exact placement: `course-g04-l03-in-010`, G4 L3, Learn It 9/11, whole-lesson page 21/39, Temperature placement practice. Existing workspace and registration retained.
- Complexity and lane: **behavior-heavy / bounded advanced-manual state machine in the hybrid workflow**. The maintained product slice is bounded to this page and its existing support adapter, with no factory scale-out claim.
- Source and implementation decision: Retain the source-bound six-card reducer, suffix-matched targets, per-card and final feedback phases, and pause-aware timers. Correct pairs are Houston 80 F, Seattle 51 F, Pittsburgh 34 F, Reno 33 F, Chicago -4 F, Fraser -18 F in top-to-bottom thermometer order. New York 43 F is a provided reference, not a seventh answer. Add success-driven completion, typed glossary requests, readable feedback, mobile numbered callouts and synchronized placement values. Source Canvas and FLA/SWF bytes are retained; current product overlays do not claim source hide or exact post-drop appearance parity.
- Source evidence: `work/g4-l3-modern-product-review/20260908-temperature/glossary-source-evidence.json` and `temperature-source-contracts.json`, including current SWF/XML/ActionScript hashes, glossary windows and entries, and host or city facts.
- Product integration: existing modern My Lesson route `/en/courses/4/3`; glossary controls use the external companion area so they do not cover mathematical labels.
- Evidence: `work/g4-l3-modern-product-review/20260908-temperature/REVIEW.md`, browser verification, regression logs, current audio and registry bindings, and the review receipt.
- Separate gates remain unchanged: authoritative original-runtime behavior, audio listening and synchronization, human visual/Owner acceptance, strict completion, whole-lesson acceptance, frozen calibration, release and publication. No new Owner approval is inferred.
