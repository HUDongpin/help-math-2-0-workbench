# course-g04-l03-rw-004 Migration Brief

Created: 2026-07-24

## Modern Product Update — 2026-09-08

G4 L3 Your World page 3 uses its existing maintained Canvas and audio with a
source-bound glossary configuration. The `interactive-understood` lane reuses
the current My Lesson Key Terms adapter; it does not modify generated output.

The source SWF remains SHA-256
`506c062e33d447d5837de2094e2d881581f602d7f10458b6eae2864e3b234710`.
Sprite 121 contains 442 frames. Button 114 (Represent) is continuously present
from frame 371 at depth 127; button 120 (Negative number) is continuously
present from frame 424 at depth 133. Same-frame remove/place pairs preserve
the visibility intervals, as verified by the extraction script.

The modern page opens the existing definitions with reversible pause and
focus restoration. A readable narrow-screen prompt is shown after both terms
appear. Fixed clipping prevents a glossary focus change from moving the
artwork or cropping the essential question.

Source extraction and current product checks are held under
`work/g4-l3-modern-product-review/20260908-rw003-rw004/`.
This engineering update does not create human approval, original-runtime
fidelity, strict audio acceptance, or deployment. The scaffold below is historical.

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

- FLA: ``
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW04.swf`
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
