# course-g04-l03-rw-002 Migration Brief

Created: 2026-07-24

## Current Modern Product Scope — 2026-09-08

This G4 L3 Your World page (whole-lesson page 2) retains its maintained Canvas
drawing and existing audio. The bounded change connects the three source
glossary actions to the modern My Lesson Key Terms panel. The Owner's current
criterion is mathematical correctness, effective instruction, and modern web
usability; reproducing the Flash UI is not required.

- Source SWF SHA-256: `8b2aa7afd7e82fc582b8e7b936d178c87fea16106b26061f872c81ea7d422785`.
- Source main timeline: `sprite-421`, 1,289 frames at 12 FPS. Buttons 377,
  378, and 379 appear at frame 1099 at depths 101, 103, and 105 and remain
  through frame 1289. Their `KeyAttribute` values are `Negative number`,
  `Less than`, and `Zero`; each calls `DoHyperLinks` and stops the animation.
- Complexity and lane: `interactive-understood`, compiler-assisted extraction
  plus the existing maintained glossary adapter. Exact source geometry is
  audit metadata; the product uses visible keyboard and touch buttons.
- Modern behavior: opening a definition pauses the page; closing it restores
  the prior play/pause state and keyboard focus. The generated drawing files,
  source bytes, and legacy ActionScript are not modified or executed.
- Maintained configuration: `packages/demos/src/timelines/course-g04-l03-rw-002.ts`.
  Integration: `packages/demos/src/modules/course-g04-l03-rw-002.tsx`.
- [Source geometry and action evidence](../../work/g4-l3-modern-product-review/20260908-rw002/glossary-source-evidence.json)
  is reproducible with the adjacent `extract-glossary-source.py` and preserves
  the source/XML/helper hashes. Both language indexes resolve the existing
  glossary entries; this page's visual review scope remains English.
- Current checks: 20 relevant checks, demos type checking, and registry
  checking pass. Browser product checks are recorded in the current worklist.
  This page has not yet received Owner product approval or deployment.

The original scaffold below remains historical planning context; it does not
grant Flash fidelity, strict audio acceptance, or lesson publication.

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
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW02.swf`
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
