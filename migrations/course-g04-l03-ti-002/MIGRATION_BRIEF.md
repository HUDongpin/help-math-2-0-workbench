# course-g04-l03-ti-002 Migration Brief

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

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI02.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI02.swf`
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


## 2026-09-08 modern-product follow-up

- Complexity and lane: behavior-heavy, bounded advanced-manual hybrid. Source extraction, maintained state/React/SVG integration, exact registry/My Lesson binding and independent acceptance gates remain part of the canonical workflow.
- Five source term/target bindings and all 120 orderings remain intact. The modern zero definition now says it represents none and is neither negative nor positive; the original source definition is preserved as `sourceDefinition`. Generated source drawings and original FLA/SWF files are not edited.
- The maintained visual overlay clarifies the zero row from the final source table layout at frame23 and throughout the quiz at frame238 (clean source drawing237). Reduced motion reaches the quiz. Current activity completion waits for the fifth successful feedback transition. Replay and paused feedback are verified separately.
- Ten source glossary button definitions represent nine distinct KeyAttribute values. Per-frame source-instance extraction consolidates them to eight visible companion buttons while preserving 24 placement/visibility segments. Ordering has no separate entry and uses the modern inflection alias Order; original host callback resolution is not established.
- The two exact G4 Zero glossary entries have clarified English/Spanish learner display in the shared browser, guarded by entry ID and exact old wording. Evidence mode and raw source JSON retain the original definition. Other entries are unchanged by the display rule.
- Source sprite174 evidence rendering remains separately bound and noninteractive. Actual browser verification covers ordinary and reduced-motion modes, desktop/mobile matching, wrong feedback, focus recovery, all five picture concepts, and post-completion picture access.
- Evidence: `work/g4-l3-modern-product-review/20260908-try-it-keyterms/REVIEW.md` and its receipt. This is current-JavaScript engineering verification; original-runtime, source timing/Replay fidelity, audio listening, human/Owner acceptance, strict completion, release and deployment are not promoted.
