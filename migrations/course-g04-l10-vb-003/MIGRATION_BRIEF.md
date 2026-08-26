# course-g04-l10-vb-003 Migration Brief

Created: 2026-08-01

## Objective

Migrate Grade 4 Lesson 10 Vocabulary page 3, “Unit of Measurement” / “Unidad de medida,” from the canonical owner-provided FLA/SWF pair into a maintainable bilingual JavaScript renderer. Preserve the source-declared 800×600 coordinate system, the separate 10-frame root and 203-frame `sprite-120` domains, the three glossary/hyperlink button obligations, English and Spanish language obligations, the embedded and host-routed audio candidates, and the complete formal acceptance sequence.

The current FFDec-derived Canvas module is an unregistered, English-only, source-static engineering candidate. This brief documents source and candidate facts without adopting that candidate as the formal renderer or advancing original-runtime, fidelity, listening, review, strict-completion, whole-lesson, release, or publication status.

## Identity And Classification

- Immutable `assetId` (`swf-<full SHA-256>`): `swf-96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d`
- Placement `animationId`: `course-g04-l10-vb-003`
- Collection, grade, lesson, section, and page: course; Grade 4; Lesson 10 “Perimeter & Area”; section `VB`; page 3; atomic release ordinal 7 of 47
- Raw title and reviewed display title: `Unit of Measurement`
- Knowledge point in English and Spanish: `Unit of Measurement`; `Unidad de medida`
- Controlled mathematics domain: vocabulary
- Classification evidence, status, and confidence: confirmed by `HELP_COURSES/ELMGR4/L10/index.xml`, canonical source placement, and the hash-bound lesson-release catalog. Source/catalog identity is confirmed; runtime fidelity remains unresolved.
- Alias or variant relationship: none declared

## Source Evidence

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf`
- Source owner/provenance: owner-provided canonical source; preserved byte-for-byte under `source-assets/`
- SHA-256 values: FLA `1eccb733544de8eb0fa718cac6a1792e2e58145c737f6170e56268fc212003f7`; SWF `96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d`
- Source byte lengths: FLA 767,488 bytes; SWF 97,444 bytes
- Missing source files: no missing paired FLA, shipped SWF, or exact-basename Spanish MP3 is currently identified for this placement. Per-file FLA authoring inspection and runtime dependency closure remain incomplete.
- Evidence conflicts and resolution: the SWF has a 10-frame root timeline and a separate 203-frame nested `sprite-120`; these are compatible structural facts, and the child duration must not be relabelled as the root frame count. The 15,144 ms external MP3 and the 16,640 ms embedded stream are distinct cue candidates, not interchangeable language tracks.

## Runtime Audit

- SWF signature/version: `CWS`, SWF version 6, ZLIB-compressed; custody file size 97,444 bytes; declared uncompressed file length 124,090 bytes
- Stage width and height: 800×600
- Frame rate, frame count, duration: 12 fps; root timeline 10 frames; root duration 833.333333 ms. `sprite-120` is a distinct 203-frame nested domain.
- Background/transparency: opaque `#b8d8f7`
- ActionScript generation and scripts: AS1/2; six exported script blocks; three `DoAction` tags
  - Root frame 1 calls `_level0.InternalPreloader.gotoAndPlay("jump_check")` and then `stop()`.
  - Root frame 6, label `begin`, calls `stop()`.
  - `sprite-120` frame 203 calls `stop()`.
  - Button 10 sets `_global.KeyAttribute = "Unit of measurement"`, calls `_root.DoHyperLinks()`, stops `_root.animation_mc.animation`, and sets `_root.boolSendPageHLAClickRecord = true`.
  - Button 11 executes the same sequence with `Quantity`.
  - Button 15 executes the same sequence with `Length`.
- Symbols, masks, morphs, filters, blend modes: 2 `DefineSprite`, 3 `DefineButton2`, 98 `DefineText`, 7 `DefineShape3`, 4 `DefineShape`, and 6 `DefineFont2` definitions. Source-static clipping placements in `sprite-120` are character 6 at frame 3/depth 1/clipDepth 8; character 12 at frame 51/depth 9/clipDepth 14; and character 42 at frame 130/depth 15/clipDepth 17. No morph definitions, filters, embedded video, or embedded bitmap images are reported by the safe adapter. Blend-mode intent has not been adopted from an authoring inspection.
- Embedded fonts and exact strings:
  - Character 1: `Bauhaus Md BT`, regular, 31 glyphs: ` &,.25:AIPSWacdefghilmnopqrstuy`
  - Character 3: `Ensemble SSi`, regular, 18 glyphs: ` &:AIPWadeimnoprst`
  - Character 17: `Stefa Display SSi`, regular, 10 glyphs: `0123456789`
  - Character 40: `Terminus Black SSi`, regular, 1 glyph: `1`
  - Character 62: `Arial`, regular, 2 glyphs: `cm`
  - Character 92: `Bauhaus Md BT`, bold, 1 glyph: `.`
  - Source-static text includes `Perimeter & Area: Important Words`, `A unit of measurement is a standard amount or quantity.`, `Some common units of measurement for length are inches, feet, centimeters, and meters.`, number labels 1–26, `cm`, and `.25`.
- Audio/video: no embedded video. An embedded MP3 stream exists in `sprite-120`: local stream head frame 1, first block frame 4, last block frame 203, 200 blocks, mono 22,050 Hz, 16,640 ms, stream synchronization; spoken language remains unresolved.
- Audio cue IDs, language tracks, hashes, durations, and start frames (`audio-inventory.csv`): external `SA/L10VB03.mp3`, SHA-256 `491873156323b693212856ce2d3bec9d0e43aac2851f547489ae9346931bff03`, 212,016 bytes, mono 48,000 Hz, 15,144 ms. Legacy host structure routes it as Spanish and user-activated; spoken content, cue ownership, synchronization, and listening acceptance remain unresolved. Candidate button/visual synchronization points at local frames 3, 3, and 51 are structural only, not accepted audio cue starts.
- FlashVars, URLs, external assets, and legacy APIs: direct host obligations include `_level0.InternalPreloader`, `_global.KeyAttribute`, `_root.DoHyperLinks`, `_root.animation_mc.animation`, `_root.boolSendPageHLAClickRecord`, and original-shell Spanish-audio play/stop controls. No legacy endpoint is authorized for execution or recreation from static evidence alone.
- Stops, labels, buttons, Replay, and user interactions: root frame 1 stops after the preloader call; root frame 6 is labelled `begin` and stops; `sprite-120` stops at local frame 203; three button release handlers invoke host glossary behavior. No exported handler is unambiguously an authored Replay/restart target, and complete Replay/reset semantics remain unresolved.
- Root-to-child placement: root frame 6 places `sprite-120` as instance `animation`, depth 4, at 8,026/4,885 twips = 401.3/244.25 px.
- Audit tools and exact versions: JPEXS FFDec 26.2.1; swfmill 0.3.6; Python 3.13.3; ffprobe 8.1.2. Adobe Animate 2021 21.0.7 is installed and a disposable-document JSFL probe passes, but per-file FLA inspection remains pending.
- Confidence by audit area: SWF header, tag, definition, frame-domain, and script structure are machine-verified. FLA authoring structure, natural runtime behavior, visual fidelity, language behavior, audio behavior, terminal state, and Replay remain unresolved.

## Baseline

- Authoritative original runtime, version, host, and toolchain receipt: none adopted
- Requirement-level authority (`natural-trace`, `direct-seek`, or `frame-step`):
  - Root EN: requirement `req-default-root-en`; trace `default-root-en`; entry-state SHA-256 `bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1`; frames 1–10; future proof may use exhaustive original-runtime direct seek or Rewind plus one sequential Step Forward per subsequent frame.
  - Root ES: requirement `req-default-root-es`; trace `default-root-es`; entry-state SHA-256 `4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067`; frames 1–10; the same restricted proof modes apply.
  - Root positioning can prove root-frame visuals only; it does not prove natural playback, interaction causality, terminal behavior, Replay, or audio.
  - Nested EN: requirement `req:sprite-120:source-proven-independent-domain-entry-unresolved:en`; trace `trace:sprite-120:source-proven-independent-domain-entry-unresolved:en:seed-0`; entry-state SHA-256 `a2ba7802bded99336ca0c6a8b3db9a8309c0fe8f5ef0dec213482387ed739cdf`; natural trace unresolved.
  - Nested ES: requirement `req:sprite-120:source-proven-independent-domain-entry-unresolved:es`; trace `trace:sprite-120:source-proven-independent-domain-entry-unresolved:es:seed-0`; entry-state SHA-256 `ffa33365361c0058ded8972ece63bc29a387a4fb5402615c5c01376ff131fe76`; natural trace unresolved.
- Separate Ruffle forensic-reference route, version, and renderer: pinned Ruffle 0.4.1 under a contained Chromium/Playwright diagnostic observed exact VB003 HTTP delivery after seven ordered host releases. It did not prove the target `begin` handshake, child-domain entry, natural playback, terminal state, audio, visual fidelity, or original-runtime equivalence. It remains forensic-only and is not a product route.
- Native viewport and device scale factor: future authoritative capture must preserve the 800×600 native stage at device scale factor 1.
- Capture method, named operator, and containment/capacity preflight: unsigned root operator-kit templates exist for EN and ES and bind Adobe Flash Player Projector 32.0.0.414, executable SHA-256 `8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30`. No named operator, source-open receipt, signature, execution report, capture manifest, or baseline adoption exists. The templates are not evidence.
- Animate authoring result index: `reports/g4-l10-animate-authoring-audit-index.json`, schema v3, SHA-256 `6ccd3d19d1acf1b8a44c22e8e9ce2dc369b038dd346a6a452d442db9f0802f44`, independently rehashes the exact current canonical lesson-release, animation, and source-freeze paths and validates the atomic 47-member release scope as 34 FLA-applicable plus 13 SWF-only/not-applicable. It currently contains 0 attempt receipts, 0/34 verified work-only authoring audits, and 34 pending items; VB003 is `pending-no-run-receipt`. Passing-receipt admission remains closed until a reviewed L10 runner/authorization/one-time-consumption successor exists; even then, a candidate receipt must bind a named assignment and exact one-row/run authorization, a fully decoded CRC-valid native PNG, and a cardinality-consistent recursive authoring inventory. The index establishes no runtime, review, acceptance, strict, or publication state.
- Required keyframes and why they matter: current structural rows cover root frames 1, 6, 9, and 10 for EN and ES. Baseline, implementation, diff, RMSE, timing, visual, and reviewer fields remain empty. Nested structural obligations include local frames 1, 3, 4, 51, 130, and 203, but they are not promoted into formal keyframe evidence until the natural trace and authoritative baseline are established.
- Complete coverage-v2 frame domains, requirements, traces, and entry-state hashes: four requirements span 426 frame identities: root EN 10, root ES 10, nested EN 203, and nested ES 203. Authoritative captures are 0/426. The nested trace specifications contain no ordered steps or execution report.
- Known emulator differences: Ruffle and FFDec-derived artifacts are diagnostic/static evidence only. No emulator difference has been accepted as a fidelity exception.

## Rendering Decision

- Selected renderer: undecided for the formal migration
- Existing engineering candidate: React plus a safe FFDec-derived Canvas 2D source-static adapter for `sprite-120`, English-only, frames 1–203
- Why it fits this animation: Canvas can preserve the dense source-static drawing sequence while the 800×600 native backing stage and pure one-indexed frame state remain explicit. This is a candidate rationale, not a fidelity decision.
- Rejected alternatives and tradeoffs: none formally rejected. React + SVG, CreateJS, and PixiJS remain open until original-runtime behavior, authored interaction semantics, localization, audio, and accessibility requirements are known.
- Accessibility and localization approach: unresolved. The current candidate disables Spanish visuals, audio, controls, and Replay rather than inventing behavior. Formal keyboard, reduced-motion, text-overflow, semantic-label, and bilingual behavior must be specified and tested before registration.

## Timeline Specification

Summarize object phases, one-indexed frame windows, transforms, alpha, depth, text/count changes, audio cues, and interaction transitions. Keep the full frame list in `keyframes.csv`.

List every reachable scenario/branch, its deterministic seed, source-evidenced trace, and terminal/Replay state. Every explicit requirement must receive full one-indexed frame coverage; do not infer requirements from a global Cartesian product.

Current source-static obligations:

- Root frames are one-indexed 1–10. Frame 1 performs the preloader call and stops. Frame 6, label `begin`, stops and places `sprite-120` at depth 4. Root frames 9 and 10 remain structural terminal-window obligations pending runtime evidence.
- `sprite-120` is a separate one-indexed 1–203 domain. Structural events include the first clipping/button placements at frame 3, first stream block at frame 4, the third glossary button and second clipping placement at frame 51, the third clipping placement at frame 130, and the final stream block plus `stop()` at frame 203.
- The source declares button release branches for “Unit of measurement,” “Quantity,” and “Length,” but runtime hit geometry, host side effects, ordered interaction traces, and terminal/replay states are not established.
- Scenario `default` exists for root EN and ES. Scenario `source-proven-independent-domain-entry-unresolved` exists for nested EN and ES. All use seed `0`; nested ordered steps, checkpoints, entry event, and terminal semantics remain unresolved.

## Asset Strategy

Summarize extracted, converted, redrawn, and generated assets. Record each item in `asset-inventory.csv`, including source character/symbol IDs and transformation notes.

The inventory currently records one generated engineering candidate: the hash-bound `sprite-120` Canvas adapter. It does not assert FLA library-symbol names. The machine audit establishes 120 SWF definitions (6 fonts, 98 texts, 11 shapes, 3 buttons, and 2 sprites), but no per-definition inventory row will be invented until a deterministic raw-tag/hash projection is available. All future extracted or redrawn assets must retain source character IDs, transformation notes, provenance, and acceptance-neutral status.

## Implementation Map

- Next.js route: none
- React component: engineering candidate only at `packages/demos/src/modules/course-g04-l10-vb-003.tsx`; not registered
- Pure timeline module: engineering candidate only at `packages/demos/src/timelines/course-g04-l10-vb-003.ts`; not adopted by the migration manifest
- Unit test file: candidate safety/identity tests at `packages/demos/tests/course-g04-l10-source-static-engineering-candidates.test.ts`; not behavior-parity tests
- Canvas asset: `public/flash-assets/courses/course-g04-l10-vb-003/canvas-renderer.js`, SHA-256 `5923392682aa868e7348e31c3db7bbab1d1ef34861c4af641b0ac71385b583ee`
- Candidate manifest: `public/flash-assets/courses/course-g04-l10-vb-003/manifest.json`, SHA-256 `bf85e1e1b77939c5b82933e3dc9a47c3ef2ba41bf65916d7ac1c3a050c9f6da7`
- Ruffle reference route: no formal or product route; contained forensic diagnostic only
- Standalone package: none
- Deterministic `?frameDomain=`, `?requirementId=`, `?trace=`, `?entryStateSha256=`, `?frame=`, `?scenario=`, `?lang=`, and `?seed=` capture modes: the candidate exposes deterministic capture identity for engineering diagnostics, but this identity is deliberately distinct from formal coverage-v2 requirements.
- Mandatory matching `data-flash-*` identity attributes: candidate module provides animation ID, frame-domain, requirement, trace, entry-state SHA-256, frame, scenario, language, and seed attributes; formal route verification remains pending.

## Verification Evidence

- Unit tests: source-static candidate tests verify frame-domain identity, fixed English mode, empty audio, inert controls, fail-closed Spanish behavior, same-origin/SRI loading, capture attributes, and absence from product registries. They do not prove key beats, ActionScript behavior, language parity, audio, terminal state, or Replay.
- Production build: no VB003 formal implementation build or route admission
- Native-size keyframe captures: no authoritative baseline or formal implementation keyframe pair
- Complete authoritative original-runtime and current-JS capture manifests: authoritative original-runtime 0/426. A current-JS engineering diagnostic captured 203/203 English source-static candidate frames at an 800×600 backing stage; its manifest is `output/playwright/g4-l10-vb003-current-js-engineering-diagnostic-v1/capture-manifest.json`, SHA-256 `c44b36665057c66c22bc7dec5603d3482bd70aea4e7df9d5d3419a99c098d43c`.
- Current-JS diagnostic census: 203 frames, 148 unique RGBA rasters, 147 changed and 55 identical consecutive pairs; candidate self-regression only
- Full-frame coverage manifest, comparisons, and archive: four formal requirements registered; 0/426 authoritative frames captured; no baseline/current-JS pair or archive adopted
- Per-frame metrics files and checksums: none for an authoritative comparison
- RMSE and diff-image results: none; 0 formal comparisons
- Replay and keyboard checks: not performed for formal behavior
- Desktop/mobile overflow checks: not performed for formal behavior
- Console and network checks: the contained current-JS diagnostic reported zero console errors/warnings, page errors, failed requests, HTTP errors, or unexpected requests and limited traffic to three exact local GET resources. This has no original-runtime, fidelity, product, or acceptance effect.
- Human reviewer and review date for all keyframe/full-frame diffs: none
- Audio listening-acceptance record, or source-bound not-required evidence: none; audio is required and unresolved
- Immutable human and owner record descriptors: none

## Exceptions And Decisions

- Per-file FLA authoring inspection is pending because Adobe Animate presents a legacy ActionScript conversion dialog that requires a named human acknowledgement. No converted FLA may be saved.
- No authoritative original-runtime capture has been adopted.
- Both 203-frame nested natural traces remain unresolved.
- Spoken language, cue ownership, start/stop/pause/resume/completion synchronization, and Replay audio behavior remain unverified.
- The current Canvas renderer is an English-only, unregistered source-static engineering candidate.
- No formal renderer route, behavior parity, full-frame original-runtime comparison, RMSE, product/accessibility QA, human visual decision, engineering acceptance, owner acceptance, strict completion, whole-lesson integration, release, or publication exists.
- No emulator difference or other exception has been accepted.

## Completion

- Engineering reviewer: pending
- Review date: pending
- Owner review status: pending
- Owner accepted decision, reviewer/date/reason, and immutable record descriptor: none
- Strict validator result: not passed; draft/preserved only
- Completion-ledger binding: preserved; no strict admission
- Atomic lesson-release status: L10 remains unpublished with 0/47 strict-complete members
