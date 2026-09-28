# course-g04-l03-in-008 Migration Brief

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

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN08.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN08.swf`
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

## 2026-09-08 Patterns modern-product follow-up

- Placement: G4 L3, Learn It 7/11, whole-lesson page 19/39, `course-g04-l03-in-008`. Existing workspace and Current-JS registration retained.
- Complexity and production lane: **behavior-heavy / bounded advanced-manual state machine within the hybrid workflow**. The source has two input fields, exact-string checking, feedback, retry, five questions sampled without replacement, and independent coach timelines. The maintained reducer and responsive surface retain that known behavior; no new factory scale-out is implied.
- Immutable source identity and placement geometry: see `work/g4-l3-modern-product-review/20260908-patterns/glossary-source-evidence.json`; freshly hashed SWF, compressed XML and ActionScript evidence. Source FLA/SWF, generated Canvas and audio assets are unchanged.
- Maintained behavior: activity completion only after a correct pair, synchronized desktop/mobile question and answer preview, visible success feedback, same-question retry, Replay reset, and the source Pattern glossary entry.
- Math basis: five source question/answer sequences freshly extracted and arithmetic checked in pattern-questions-source-evidence.json; AVM1 randomness remains unexecuted.
- Product review evidence: `work/g4-l3-modern-product-review/20260908-patterns/REVIEW.md`, browser-verification.json, test logs, source/audio bindings and product-review-receipt.json.
- Current-JS engineering verification remains separate from original-runtime observation, audio listening, human visual review, Owner approval, strict completion, whole-lesson acceptance, release and publication. No new downstream gate is closed here.
