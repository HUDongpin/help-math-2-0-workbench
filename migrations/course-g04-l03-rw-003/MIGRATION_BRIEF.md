# course-g04-l03-rw-003 Migration Brief

Created: 2026-07-24

## Modern Product Update — 2026-09-08

G4 L3 Your World page 2 retains its existing Canvas renderer, source frames,
and audio. The `interactive-understood` lane uses the maintained glossary
adapter for Positive and Negative. Their source handlers and glossary entries
are unchanged; the modern panel now uses a reversible support-tool pause.
Closing it resumes only when the learner had been playing, with focus returned
to the initiating control. No Flash UI replication is required.

The source SWF remains SHA-256
`783b74b036a7af4031f17ce9e1aab7536665c84a73400b3a980cfa3e89a9a335`.
Modern narrow screens display a readable summary after both terms appear.
The product viewport prevents focus-induced internal scrolling and gives the
native y=100 Positive label enough top clearance; the source Canvas bytes and
internal coordinates are preserved.

Current browser checks and code bindings are held under
`work/g4-l3-modern-product-review/20260908-rw003-rw004/`.
Product repair is separate from human approval, original-runtime fidelity,
strict audio acceptance, and deployment. The scaffold below is historical.

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

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW03.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW03.swf`
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
