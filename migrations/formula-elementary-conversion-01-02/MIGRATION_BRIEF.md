# formula-elementary-conversion-01-02 Migration Brief

Created: 2026-07-20
Engineering evidence formalized: 2026-07-21

## Objective

Rebuild the owner-provided Conversion_1_2 formula animation as a deterministic Next.js/React experience while preserving the native 780 × 379 stage, 12 FPS, 109 one-indexed frames, Replay, host-controlled English/Spanish formula context, and separately triggered narration tracks.

## Identity And Classification

- Asset: `swf-91d63f9f045d2097cd0f46c59ceacd4faefd95851f9039003589d8052c39e758`
- Placement: `formula-elementary-conversion-01-02`
- Collection/grade/domain: formula · elementary/shared · formula-reference
- Raw title: `Conversion 1 2`; display title: “1 gallon = 128 fluid ounces”
- Knowledge point: Gallon and fluid-ounce conversion / Conversión entre galones y onzas líquidas
- Classification: confirmed from source path, embedded text, FLA/SWF audit, and runtime evidence; overall confidence remains medium because complete original-host traversal and audio acceptance remain open.

## Source And Runtime Audit

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_2.fla` — `7c59923ebd200f4fb951e1c9a7683861c21af7688d537fa5fca370acf6d9291d`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_2.swf` — `91d63f9f045d2097cd0f46c59ceacd4faefd95851f9039003589d8052c39e758`
- Runtime: CWS SWF 6; 780 × 379; 12 FPS; 109 frames; 9083.333333333334 ms; background `#e4e4e4`; AS1/2.
- Read-only Adobe Animate audit: MAC 21,0,7,42652; native authoring metadata agrees with the SWF. Animate's in-memory AS1 conversion means preserved SWF bytecode remains authoritative for scripts.
- Behavior: one linear teaching timeline, terminal `stop()` on frame 109, Replay `gotoAndPlay(1)`, no randomness, scoring, learner input, embedded audio, video, network call, or remote resource.
- Complexity: medium because the linear timeline combines morphs, source matrices/alpha, a host language flag, embedded glyphs, and Replay.
- Tools: Adobe Flash Player 32.0.0.414; Animate 2021; FFDec 26.2.1; swfmill 0.3.6; Chromium 149.0.7827.55 / Playwright 1.61.1.

## Localization And Audio Contract

The visual language contract is **not invariant**. In `frame_1/DoAction.as`, `_root.dtfSpanishFormulas.text.toUpperCase() == "ON"` controls `Mc_SD._visible` (hash-bound bundle: `1c461cfe9030a0d58aa8806302499411606fe69eed710b998d08211f240970a8`). The English Adobe baseline is therefore not reused as a Spanish alias. `baseline/source-composited-spanish-default.json` combines the same-frame hash-verified Adobe natural-playback dynamics with only source-extracted `Mc_SD` at its audited root depth/transform; it proves persistence through all 109 child frames and is calibrated against source structure at frame 1 and frame 109. The scope-limited 01-01 controlled Adobe root cross-check corroborates the shared visibility contract but is not represented as a parent run for this file; the original `indexELM` external default remains unrecovered.

The exact EAD/SAD MP3 files and metadata are inventoried. They have `start_semantics=host-user-activated` and a blank `start_frame`: source host scripts show user-controlled loading, not a child-timeline cue. Spoken content, perceptual language, original-host activation, and synchronization are not signed.

## Baseline

The adopted visual authority for the English standalone linear scenario is the untouched, hash-verified SWF stepped deterministically in Adobe Flash Player 32.0.0.414. The report `baseline/adobe-flash-player-32-standalone-default.json` binds every native PNG to its hash. FLA/SWF metadata agree, and the source audit found no additional standalone branch beyond the host-controlled language panel and Replay reset.

Spanish child visuals use the separately hash-bound source-composited baseline; FFDec whole frames are structural evidence only and are never used as runtime frames. Ruffle remains available at `/reference/formula-elementary-conversion-01-02` only as a forensic reference and was not used as the accepted pixel authority.

## Rendering Decision And Implementation

- Rendering: React + SVG using source-extracted vector, glyph, and level assets.
- Route: `/animations/formula-elementary-conversion-01-02` (local audit only while status is `preserved`).
- Component: `components/GallonConversionAnimation.jsx`
- Timeline: `lib/conversionTimeline.js`
- Tests: `lib/conversionTimeline.test.mjs` and package demo contract tests.
- Registry: `./modules/conversion-1-2`
- Deterministic contract: `?frame=`, `?scenario=default`, `?lang=en|es`, `?seed=0`, `?capture=1`; both runtime and renderer report `data-flash-frame`.
- Replay: the same frame-1 timeline is restarted by mouse, Enter, and Space. Reduced motion freezes at frame 1 with an explanatory status.
- Ruffle/video were rejected as production renderers because this animation requires maintainable language, Replay, accessibility, and exact-frame state.

## Evidence And Current Result

- English full-frame comparison: 109/109 frames, all assigned thresholds pass.
- Normalized RMSE: min 0.024213313361713645; mean 0.02652369817714099; max 0.030659726204404127; p95 0.0292553803070267.
- Spanish child-visual comparison: 109/109 frames, all assigned thresholds pass; RMSE min 0.02440120811076301, mean 0.026695864804177426, max 0.030808330435796925, p95 0.029411081078753152.
- Contact sheets: 11 English pages plus 11 Spanish pages, with every frame represented exactly once per language.
- Behavior QA: `evidence/behavior-qa.json`; product QA: `evidence/product-qa.json`; audio-control QA: `evidence/product-audio-controls-qa.json`.
- Product checks cover native capture, desktop, tablet, narrow mobile, Replay mouse/Enter/Space, accessible Replay name/focus, reduced motion, implementation localization, overflow, console, failed requests, HTTP errors, and external-network checks.
- Key teaching frames and hashes are in `keyframes.csv`; all-frame canonical metrics are in `evidence/full-frame-metrics-default-en.json`.

## Explicit Remaining Gates

1. Complete original `indexELM` external-default and host-traversal parity; child-SWF Spanish visual parity is complete.
2. Authoritative English and Spanish audio listening plus original-host activation/timing/synchronization.
3. Human inspection/signature for every diff/contact-sheet page.
4. Owner acceptance.
5. Strict validator and status promotion; status intentionally remains `preserved`.

## Acceptance

Codex engineering review accepts the hash-bound English standalone result, the source-composited Spanish child-visual result, structural SWF/FLA persistence evidence corroborated by the scope-limited 01-01 controlled Adobe root cross-check, and the modern implementation behavior/product QA. `npm test` passes 173/173, demo tests pass 52/52, demo type checking passes, and draft migration validation passes. Human visual review, owner acceptance, complete original-host traversal, authoritative audio listening/synchronization, strict validation, and status promotion remain unsigned. No accepted exception converts those missing gates into completion.
