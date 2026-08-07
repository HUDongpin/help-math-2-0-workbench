# keyterm-elementary-computeghgh Migration Brief

Created: 2026-07-20

Evidence formalized: 2026-07-21

Current disposition: **validating — not a complete migration**

## Objective

Preserve and rebuild the owner-provided unreferenced `computeghgh.swf` child movie as a deterministic Next.js candidate without inventing its knowledge-point identity, Spanish mapping, audio policy, or acceptance status. Reproduce the static teaching scene, terminal stop, Replay pointer states, Replay restart behavior, native timing, and modern product behavior while keeping unresolved source questions fail-closed.

## Identity And Classification

- Immutable `assetId`: `swf-fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8`
- Placement `animationId`: `keyterm-elementary-computeghgh`
- Collection/grade/domain: `keyterm` / `elementary/shared` / `vocabulary`
- Catalog raw/display title: `Computeghgh`, inferred only from the source basename
- Visible SWF heading: `Common Sense / Computar`
- Spanish knowledge point/definition: unresolved
- Classification: `inferred`; no active elementary key-term XML references this SWF
- Alias/variant: none; this canonical binary has one unreferenced placement

The filename and visible heading are retained as separate evidence. The visible text does not authorize silently renaming the catalog placement or inventing a Spanish definition.

## Source Evidence

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.fla`
  - SHA-256: `6307c1d0ceced1527981c40bce6bd7b4015a7f0f5c650546cac2a5c095add722`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.swf`
  - SHA-256: `fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8`
- Provenance: owner-provided; catalog and machine audit verify both hashes without modifying either source.
- Authoring evidence: a read-only, byte-identical working copy received the
  current recursive schema-v2 Adobe Animate 2021 audit. The canonical audit is
  `audit/adobe-animate-2021-authoring-audit.json` (SHA-256
  `c575901e80f046d431ea5b72a285076e122cc7fb5412a9e2a5d3f3260307be52`)
  and its native 225 × 225 frame-35 capture is
  `audit/adobe-animate-2021-authoring-frame-0035.png` (SHA-256
  `734e1951e2316fed5c50b82c9f7946656ab3c77df0b07e4758104247ba878374`).
  This proves current authoring structure only; the shipped SWF bytecode and
  original runtime remain authoritative for behavior removed by Animate's
  in-memory AS1 conversion.
- Placement limitation: no key-term XML entry, original host route, English/Spanish title pair, or definition was found.

## Runtime Audit

- SWF: `CWS`, version 6, declared uncompressed length 5,325 bytes
- Stage/background: 225 × 225, opaque `#ffffff`
- Timeline: 12 FPS, 35 frames, 2,916.667 ms
- ActionScript: AS1/2
  - frame 35: `stop()`
  - Replay button release: `gotoAndPlay(1)`
- Visual structure: all 35 root frames have the same structural and Adobe-runtime visual hash
- Font: two embedded `Bauhaus Md BT` definitions
- No morph, filter, external import, network candidate, video, scoring, random operation, or answer input was found.
- Audio structure: the source-hash-bound shipped SWF has no `DefineSound`, sound stream, `StartSound`, exported sound linkage, exact external basename association, or audio ActionScript operation. The preserved archive has no matching MP3 and no XML/catalog host placement can create an external cue. `audit/audio-runtime-evidence.json` therefore records strict `accepted-not-required`; no cue exists to listen to or synchronize.
- Tools: FFDec 26.2.1, swfmill 0.3.6, Adobe Flash Player 32.0.0.414, Playwright 1.61.1 / Chromium 149.0.7827.55, FFmpeg 8.1.2, ImageMagick 7.1.2-27

Confidence remains limited because the source identity, runtime behavior, and shipped-runtime no-audio conclusion are strong, while the instructional identity, original-host localization, and FLA authoring view remain unresolved.

## Baseline

The adopted default/up child-visual authority is the untouched SWF deterministically stepped in Adobe Flash Player 32.0.0.414:

- Native viewport: 225 × 225 at device scale 1
- Baseline archive: `artifacts/full-frame/pilot-baselines/keyterm-elementary-computeghgh/adobe-flash-player-32-standalone-default`
- Report: `baseline/adobe-flash-player-32-standalone-default.json`
- Report SHA-256: `3da59ca060ade75c8fa4ea6089870af7f888fc73a07ba84bc6807bdbc605158e`
- Interaction supplement: `baseline/adobe-flash-player-32-replay-interaction.json`
- Interaction report SHA-256: `2ad43f48ce111bbeb0024a95354f40b0664531ad55ee31669266ca292d5e9533`
- Source-structural button-state supplement: `baseline/swf-structural-button-states.json`
- Source-structural supplement SHA-256: `6d1bc537bbf4b337cd12ab3e26b25874c544f196e4d85ac5496f808728d564e4`
- Ruffle route: `/reference/keyterm-elementary-computeghgh` is local forensic reference only.

Adobe interaction evidence establishes:

- Replay up: lossless native-stage PNG
- Replay over: lossless native-stage PNG and a passing one-frame comparison
- Replay down: authoritative runtime evidence exists only as a Computer Use JPEG containing 28 pixels of player chrome and pointer pixels; it cannot be used for native-stage RMSE
- Replay release: the Player resumed from terminal stop and returned to stop after one 35-frame duration

The down-state pixel baseline is therefore derived from higher-priority SWF structure rather than from that JPEG. A reproducible ElementTree parser verifies `DefineButton2` state membership and the depth-28 `PlaceObject2` transform. The builder combines the transform (`4679`, `4071` twips) with the FFDec export registration (`81.85`, `11.8` px) to derive stage position (`152.1`, `191.75` px), then renders lossless 225 × 225 up/over/down PNGs with sharp. The method is calibrated independently against both lossless Adobe states: up RMSE `0.0330456`, over RMSE `0.0320490`; both pass `0.05`. The source-structural down baseline versus the modern pressed capture is `0.0221700` and passes. The Adobe JPEG remains qualitative runtime confirmation only.

The Adobe interaction report is retained as the immutable runtime-capture record and therefore still states its pre-supplement lossless-down limitation. The later hash-bound structural report and engineering prereview supersede that single visual-evidence gap without rewriting the historical capture record.

The pointer states are transient interactions within the single `default` scenario, not independent 35-frame teaching branches.

## Rendering Decision

The implementation uses React + SVG. A source-derived lossless PNG preserves the common static scene, while the three Replay states remain editable script-free SVGs with embedded glyph paths. A pure TypeScript state machine handles pointer transitions and Replay requests.

- Selected: React + SVG with source-derived static raster scene and vector button-state assets
- Why: the source root visual is static and the only dynamic product behavior is a small interactive button state machine
- Rejected: CSS-only choreography would obscure source timing/state; Ruffle is reference-only; video would remove interaction and accessibility
- Accessibility: the modern transparent button supplies a language-aware accessible name and standard focus/keyboard activation without changing source pixels

## Timeline And Interaction Specification

`packages/demos/src/timelines/keyterm-computeghgh.ts` defines the immutable movie metadata and pure state functions:

1. Frames 1–34: the static scene remains visible.
2. Frame 35: the same scene remains visible and source ActionScript calls `stop()`.
3. Replay up/over/down: transient terminal pointer states within `default`.
4. Replay activation: `gotoAndPlay(1)` semantics; the modern player resets to one-indexed frame 1.

The production-facing scenario list is intentionally only `default`. Internal pointer states remain queryable and tested, but they are not misclassified as full-timeline scenarios.

## Asset And Audio Strategy

`asset-inventory.csv` records the shared scene PNG plus up/over/down SVGs, their source identity, transformation, hashes, and evidence limitations. The renderer does not load the original SWF or Ruffle.

`audio-inventory.csv` intentionally has no cue rows. `audit/audio-runtime-evidence.json` binds the shipped SWF, machine evidence, preserved archive catalog, XML non-placement, and empty cue inventory. It establishes a structural negative proof with strict `accepted-not-required` status; no listening record is created because there is no reachable shipped-runtime cue.

## Implementation Map

- Product route: `/animations/keyterm-elementary-computeghgh`
- Route file: `apps/web/app/[locale]/animations/[animationId]/page.tsx`
- Renderer: `packages/demos/src/modules/keyterm-elementary-computeghgh.tsx`
- Pure timeline/state machine: `packages/demos/src/timelines/keyterm-computeghgh.ts`
- Tests: `packages/demos/tests/keyterm-pilots.test.ts`
- Registry module: `./modules/keyterm-elementary-computeghgh`
- Local SWF reference: `/reference/keyterm-elementary-computeghgh`
- Standalone package: not requested
- Deterministic runtime contract: `?frameDomain=root`, `?requirementId=`, `?trace=`, `?entryStateSha256=`, `?frame=`, `?scenario=default`, `?lang=en|es`, `?seed=`, and `?capture=1`, with matching `data-flash-frame-domain`, `data-flash-requirement-id`, `data-flash-trace-id`, `data-flash-entry-state-sha256`, `data-flash-frame`, and root-frame identity attributes. The current browser QA proves this runtime contract; the archived 35-frame coverage manifests still require a coverage-v2 recapture.

## Verification Evidence

- Canonical default/en and default/es coverage: 35/35 frames each, no missing frames
- RMSE for both language contexts: 0.0264046 for every frame; all assigned static thresholds pass
- Replay over comparison: normalized RMSE 0.0259303, below the static threshold
- Replay structural compositor calibration: up RMSE 0.0330456 and over RMSE 0.0320490; both pass the static threshold
- Replay down modern state: source-structural baseline RMSE 0.0221700; the pair passes engineering prereview while the original Adobe JPEG remains excluded from RMSE
- Canonical capture manifests report zero console errors, failed requests, HTTP errors, or unexpected requests.
- Canonical contact sheets: four pages for English and four for Spanish under `evidence/contact-sheets/default-{en,es}/`. These packets are not human-review signatures.
- Modern product QA: `evidence/keyterm-engineering-qa.json`, `behavior-qa.json`, and `product-qa.json` pass native, desktop, tablet, mobile, mouse/Enter/Space Replay, reset, focus, accessible naming, reduced motion, asset, console, and network checks.
- Product localization QA proves route/runtime plumbing and language-aware accessibility metadata only. It does not resolve the absent original XML mapping.
- Engineering prereview passed default/up and lossless hover visual inspection plus the calibrated source-structural pressed-state comparison. After the workstation machine audit was refreshed to record Adobe Animate availability, the structural evidence chain was rebuilt against machine-report SHA-256 `8de16cf9f4e55ada403938284f3d7c465a646ee2297fb8b3599877b0b2be0739`; all state PNGs, diff PNGs, and RMSE values remained unchanged.
- Current JavaScript output approval is recorded as accepted. Strict named-human review of all required frame/diff, bilingual, audio, and interaction evidence remains pending.

## Exceptions And Blocking Decisions

No mismatch has an owner-accepted exception.

1. **Instructional identity/localization:** obtain owner or original-host evidence for the intended knowledge-point title and Spanish term/definition. Preserve `Computeghgh` and `Common Sense / Computar` separately until resolved.
2. **Original-runtime natural trace:** the FLA authoring audit is complete, but
   it does not prove the source Replay release, terminal stop, or replay-reset
   sequence. Supply the hash-bound original-runtime natural trace required by
   the current interactive root trace specification.
3. **Coverage-v2 identity:** the existing 35-frame en/es evidence is complete and within threshold, but its legacy coverage-v1 capture manifests do not bind `frameDomain`, `requirementId`, `trace`, or `entryStateSha256` as required by the current Timeline Contract.
4. **Human and owner review:** the user approved the current JavaScript visual output, but did not provide the named, evidence-bound strict human-review record and did not state that they are the HELP Math owner or an authorized owner representative. Both strict decisions remain pending.

## Completion

- Engineering review: refreshed and accepted by Codex on 2026-07-21 for the current hash-bound default child visuals, Adobe-calibrated up/over structural compositor, source-structural down comparison, strict accepted-not-required audio proof, deterministic frame, Replay/pointer behavior, accessibility, console, asset, and network-QA scope only. FLA authoring inspection, localization authority, owner review, strict validation, and status promotion are explicitly excluded.
- Human visual review: pending; the separate current JavaScript output approval was accepted by the project user on 2026-07-22.
- Owner review: pending.
- Strict validator: expected to fail while status is `validating`,
  owner/localization authority, the original-runtime natural trace, and
  coverage-v2 baseline/metrics remain unresolved, and checklist items remain
  open.
- Publication: prohibited; the item remains outside the strict public library.
