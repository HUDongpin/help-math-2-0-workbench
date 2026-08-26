# course-g04-l03-ts-006 Migration Brief

Created: 2026-07-24

## Objective

Rebuild G4 L3 TS006 (4 Step Plan) as an 800×600 bilingual-capable HTML5 lesson page while preserving the original Flash timeline domains and failing closed wherever authoritative behavior is not yet established. The current implementation is an engineering candidate, not a faithful or accepted migration.

## Identity And Classification

- Animation: `course-g04-l03-ts-006`; immutable asset: `swf-fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47`.
- Course placement: Grade 4, Lesson 3, TS page 6; release sequence 34/40.
- Knowledge point: 4 Step Plan / Plan de 4 Pasos.
- Confidence: low until original-runtime, bilingual, audio, visual, and behavior evidence closes.

## Source Evidence

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.fla` (SHA-256 `3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd`).
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf` (SHA-256 `fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47`).
- Work-only Animate audit: `run-tkpM0N`, MAC 21,0,7,42652; this is authoring structure only.
- Sources remain owner-provided and byte-preserved.

## Runtime Audit

- SWF v6 CWS; 800×600; 12 FPS; root 1–10; background #b8d8f7.
- ActionScript: AS1/2; 3 exported frame scripts; no static external API candidates.
- Frame domains: root 1–10; sprite-23 1–128 at root frame 6; sprite-3 is a one-frame scriptless composite child for independent-playhead disposition only.
- Audio: sprite-23 contains one embedded stream. The exact associated L3TS06.mp3 is staged only as a same-origin, user-activated Spanish host-audio engineering candidate. Embedded audio, source-media matching, spoken content/language, original-host semantics, synchronization, listening, Replay reset, and acceptance remain unresolved.

## Baseline

- Ruffle route: `/reference/course-g04-l03-ts-006` for forensic reference only.
- Authoritative original-runtime baseline: not captured; natural Lesson Shell trace: not executed.
- Native capture viewport: 800×600 at device scale 1.

## Rendering Decision

A source-static Canvas adapter is retained because the FFDec drawing bundle can be executed without legacy ActionScript, timers, network, storage, or embedded audio. The product host exposes the exact Spanish MP3 only after a user action and only from the same origin. This is current-JavaScript product behavior, not authorization or audio acceptance; root, Spanish visuals, embedded audio, companion rendering, original-host semantics, Replay parity, and fidelity remain blocked.

## Timeline Specification

- `root`: 10 frames, current renderer scenario `root-unavailable`; every EN/ES frame remains a pending natural-trace requirement.
- `sprite-23`: 128 frames, scenario `source-static-frame`; EN is renderer-addressable, ES remains blocked.
- `sprite-3`: composite-child-with-parent for the independent local-playhead question; all visual and behavioral obligations remain pending.
- Flash frames remain one-indexed.

## Asset Strategy

The generated Canvas runtime and its safety manifest are hash-bound in `asset-inventory.csv`. They are derived engineering assets and do not substitute for the preserved FLA/SWF or an authoritative runtime baseline.

## Implementation Map

- Route: `/animations/course-g04-l03-ts-006`.
- React module: `packages/demos/src/modules/course-g04-l03-ts-006.tsx`.
- Pure timeline/config: `packages/demos/src/timelines/course-g04-l03-ts-006.ts`.
- Implementation test: `packages/demos/tests/course-g04-l03-ts-006.test.ts`.
- Acceptance-neutral host-audio product QA: `migrations/course-g04-l03-ts-006/evidence/spanish-host-audio-current-js-product-qa.json`.
- Deterministic identity binds frameDomain, requirementId, trace, entryStateSha256, frame, scenario, lang, and seed.

## Verification Evidence

- Candidate browser execution: 128/128 sprite-23 EN frames encoded; 1 unique visual hash.
- The host-audio product QA observed user activation, exact same-origin MP3 routing, pause-while-playing state, and capture-mode withholding only.
- Original-runtime baseline used: no; source-media match: no; authoritative listening: no; RMSE computed: no; visual/behavior/audio parity claimed: no.
- Current candidate report: `reports/g4-l3-ts006-current-javascript-candidate.json`.
- Renderer frame-domain support audit is required at `audit/renderer-frame-domain-support.json`.

## Exceptions And Decisions

Root composition and InternalPreloader behavior, natural entry, Spanish visuals, embedded audio, source-media matching, spoken Spanish/content, original-host audio semantics, synchronization, listening, interaction, terminal/Replay state, full-frame baseline/diffs/RMSE, accessibility, independent human review, Owner acceptance, and release admission remain unresolved. No UI enablement, waiver, authorization, or acceptance is created by this brief.

## Completion

- Engineering review: pending.
- Human visual review: pending.
- Owner review: pending.
- Strict validator: expected to fail closed until all listed obligations are complete.
