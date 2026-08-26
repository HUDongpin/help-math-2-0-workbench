# keyterm-elementary-acute-angle Migration Brief

Created: 2026-07-20
Evidence formalized: 2026-07-21
Technical QA refreshed: 2026-07-22
Current disposition: **blocked — not a complete migration**

## Objective

Rebuild the owner-provided elementary/shared “Acute angle” key-term child movie as a deterministic Next.js animation while preserving the original 225 × 225 coordinate system, 12 FPS timing, 60 one-indexed frames, bilingual host context, narration evidence, and review boundaries. The public library must continue to exclude this item until every strict gate passes.

## Identity And Classification

- Immutable `assetId`: `swf-dbc56af636e5551c582977f9230be2ae530874a05c901f0cf44dd5e2d5f2a347`
- Placement `animationId`: `keyterm-elementary-acute-angle`
- Collection/grade/domain: `keyterm` / `elementary/shared` / `vocabulary`
- Raw and display English title: `Acute angle`
- Raw Spanish XML title: `Àngulo agudo` (preserved exactly; it is not silently normalized to `Ángulo agudo`)
- Classification: `confirmed` by `ELKTEG4.xml` and `ELKTSG4.xml`, both of which reference `Acute_angle.swf`
- Alias/variant: none; this canonical binary has one source placement

## Source Evidence

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.fla`
  - SHA-256: `f129e5a338c2d9c70d004e8473f6cb3ea7f4883f67d28ebe72607057f9ef6837`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.swf`
  - SHA-256: `dbc56af636e5551c582977f9230be2ae530874a05c901f0cf44dd5e2d5f2a347`
- Provenance: owner-provided; the catalog and machine audit verify both hashes without modifying either source.
- Authoring limitation: the binary FLA has not yet received a read-only Adobe Animate library/layer/publish-settings inspection. SWF structure and Adobe Player runtime remain the current authority.
- Missing source: the original host requires `HELP_KEYTERMS/KT/ELEMENTARY/SAD/acute_angle.mp3` for Spanish narration, but that file is absent. No synthesized or substitute narration is accepted.

## Runtime Audit

- SWF: `CWS`, version 6, declared uncompressed length 5,536 bytes
- Stage/background: 225 × 225, opaque `#ffffff`
- Timeline: 12 FPS, 60 frames, 5,000 ms
- ActionScript: none detected; zero exported script files and no script tags
- Structure: 15 `DefineMorphShape` definitions, no filter/import/audio/video tags, no runtime network candidate, and one embedded `Bauhaus Md BT` font definition with 16 glyphs
- Child behavior: linear geometry only; no scoring, randomness, learner input, or child Replay button
- Playback semantics: no root `stop()` action is present. In native Flash semantics the 60-frame root timeline therefore wraps automatically from frame 60 to frame 1 and keeps playing. The modern module now explicitly declares `playbackMode: 'loop'`; the shared runtime preserves the wrap while retaining the player-level Replay control as an accessible restart affordance.
- Host dependencies: key-term XML supplies surrounding English/Spanish title and definition; `indexELM.swf` selects EAD for English narration and SAD for Spanish narration
- Tools: FFDec 26.2.1, swfmill 0.3.6, Adobe Flash Player 32.0.0.414, Playwright 1.61.1 / Chromium 149.0.7827.55, FFmpeg 8.1.2, ImageMagick 7.1.2-27

Confidence is medium: source identity, SWF structure, native runtime frames, modern product behavior, and the recursive schema-v2 Animate authoring audit are directly evidenced; authoritative host/audio traversal and the original Spanish narration source remain missing.

## Baseline

The adopted child-visual authority is the untouched SWF deterministically stepped in Adobe Flash Player 32.0.0.414. `baseline/adobe-flash-player-32-standalone-default.json` records all 60 lossless native-stage PNGs, source hash, capture protocol, crop, alpha normalization, and file hashes.

- Authority: original SWF in Adobe standalone runtime
- Native viewport: 225 × 225 at device scale 1
- Baseline archive: `artifacts/full-frame/pilot-baselines/keyterm-elementary-acute-angle/adobe-flash-player-32-standalone-default`
- Baseline report SHA-256: `c71f8760a5ae0541ba90d4ffde3bad463f35eb93c104ee0f5a5fc36a83c9686d`
- Ruffle route: `/reference/keyterm-elementary-acute-angle` is a local forensic reference only and was not promoted as baseline authority.

The child has no language script or import path and its artwork already contains the same bilingual heading in every context. The standalone Adobe frames are therefore adopted only for the language-neutral child visual timeline. They do not prove original-host title/definition layout, language selection, or narration.

## Rendering Decision

The current pilot uses a fixed SVG `viewBox` and chooses one source-derived lossless 225 × 225 PNG for each one-indexed frame. A pure TypeScript timeline clamps and selects frames; React supplies responsive layout and accessible English/Spanish descriptions.

- Selected: React + SVG stage with a hash-inventoried root-frame PNG sequence
- Why: the source is a small morph-heavy child with no interaction state; the sequence preserves authored rasterization and exact timing while remaining deterministic
- Rejected as current implementation: CSS choreography would not encode the Flash timeline; Ruffle is reference-only; video would remove exact-frame semantics
- Maintainability limitation: geometry is not editable as independent vectors. The source-derived sequence is acceptable as the current pilot candidate, but a later vector decomposition may replace it if owner review requires editability.

## Timeline Specification

`packages/demos/src/timelines/keyterm-acute-angle.ts` defines the immutable stage, FPS, frame count, duration, clamped one-indexed frame query, language context, and frame asset path. The only reachable scenario is `default`:

1. Frame 1: initial bilingual heading and geometry.
2. Frames 2–59: AC rotates about A through source-authored morph states; the canonical full-frame metrics classify these as transitions.
3. Frame 26: AC reaches the dotted vertical guide.
4. Frame 33: AC has passed the return-side vertical boundary.
5. Frame 43: largest measured implementation/baseline residual, still visually aligned in engineering prereview.
6. Frame 60: end-of-cycle composition returns to the frame-1 geometry; on the next source tick the root timeline wraps to frame 1 and continues toward frame 2.

`keyframes.csv` records the five teaching/review frames for both product languages. `evidence/full-frame-comparison-default-{en,es}.json` retains a metric and hash for every frame, including all intermediate morph frames.

The canonical captures and RMSE metrics cover every still frame in one source cycle. Because frame 60 and frame 1 are visually the same, image comparison alone cannot prove whether playback stops or loops. The modern browser QA now records the live DOM frame sequence `60 → 1 → 2`, while the pure timeline test proves the same elapsed-time mapping. A separate deterministic check holds `?frame=60` at 60 for 350 ms, proving that audit capture remains frozen even though normal playback loops.

## Asset And Audio Strategy

- `asset-inventory.csv` points to `baseline/ffdec-root-frames.json`, whose 60 rows bind every extracted frame path to its SHA-256.
- The renderer does not load the original SWF or Ruffle.
- English narration has an exact basename association:
  - `EAD/acute_angle.mp3`
  - SHA-256 `8b150d56158690d70c8f9891a72c13fdb62719b973bf970dcdeadaed612dc97f`
  - duration 7,871 ms, mono, 44.1 kHz
- Its start semantics are `host-user-activated`; no root frame is invented.
- Authoritative listening, start/cue synchronization, pause/resume, and completion are pending.
- The Spanish SAD counterpart is missing and blocks strict bilingual audio acceptance.

## Implementation Map

- Product route: `/animations/keyterm-elementary-acute-angle`
- Route file: `apps/web/app/[locale]/animations/[animationId]/page.tsx`
- Renderer: `packages/demos/src/modules/keyterm-elementary-acute-angle.tsx`
- Pure timeline: `packages/demos/src/timelines/keyterm-acute-angle.ts`
- Tests: `packages/demos/tests/keyterm-pilots.test.ts`
- Registry module: `./modules/keyterm-elementary-acute-angle`
- Local SWF reference: `/reference/keyterm-elementary-acute-angle`
- Standalone package: not requested
- Deterministic contract: `?frame=`, `?scenario=default`, `?lang=en|es`, `?seed=`, `?capture=1`, and exact `data-flash-frame`
- Live playback contract: module `playbackMode: 'loop'`; source root timeline wraps `60 → 1 → 2`, while Replay resets to 1 and resumes at 2

## Verification Evidence

- Canonical default/en and default/es coverage: 60/60 frames each, no missing frames
- RMSE for both language contexts: min 0.0341622, max 0.0395136, mean 0.0359327, p95 0.0385966; all assigned static/transition thresholds pass
- Canonical capture manifests report zero console errors, failed requests, HTTP errors, or unexpected requests.
- Canonical contact sheets: six pages for English and six for Spanish under `evidence/contact-sheets/default-{en,es}/`.
- Engineering visual prereview: all six earlier English standalone contact-sheet pages were inspected; this is explicitly not human review or owner acceptance.
- Current JavaScript output approval: the project user explicitly approved the generated JavaScript animation on 2026-07-22. That approval is preserved separately and does not satisfy the strict named-human review of every required frame/diff, bilingual, audio, and interaction artifact.
- Modern product QA: `evidence/keyterm-engineering-qa.json`, `behavior-qa.json`, and `product-qa.json` were regenerated against the current shared runtime and pass 23/23 engineering assertions: native, desktop, tablet, mobile, the live `60 → 1 → 2` source loop, frozen deterministic frame 60, mouse/Enter/Space Replay reset `1 → 2`, focus, accessible naming, reduced motion, asset, console, and network checks. Their authority boundary still excludes original audio, owner acceptance, and strict completion.
- Localization QA proves modern route/runtime plumbing and accessible metadata; it does not turn the missing SAD track or untraversed legacy host into authoritative Spanish content.
- Deterministic Spanish-audio source forensics: `audit/acute-angle-spanish-audio-source-forensics.json` rehashes all 4,565 preserved MP3 files and their ID3-stripped payloads, binds the key-term XML/host ActionScript/SWF/FLA audits, and confirms that no provenance-backed `SAD/acute_angle.mp3` alias or embedded copy exists. All course recordings remain unpromoted semantic candidates; strict acceptance effect is none.
- Manifest evidence hash audit: all ten declared baseline, coverage, English/Spanish comparison, contact-sheet, engineering/behavior/product QA, and structural-audio audit hashes match the current files. This verifies available evidence bytes; it does not make the absent Spanish MP3 exist.
- Exact repository verification: `npm test` passes 466/466 and `npm run build` completes the Next.js production build. The hash-bound receipt is `reports/pilot-verification-runs/2026-07-21T204319-586Z-0fb53ef0/command-results.json`; `evidence/verification.json` binds both zero-exit results to migration manifest SHA-256 `7356cd86182f8786995acd4b170a7417dc51af872bf9a015eb0d85c8d4ae2747`.

## Exceptions And Blocking Decisions

No mismatch has an owner-accepted exception.

1. **Missing Spanish narration source:** `SAD/acute_angle.mp3` is absent. Obtain the authoritative source and validate original-host listening/synchronization. Under the current runbook and validator, an owner signature alone cannot replace this machine gate; do not synthesize or substitute it silently.
2. **Audio listening and synchronization:** the English file is hash-verified but has not received authoritative spoken-content listening or original-host cue synchronization.
3. **Host traversal:** the original key-term host's bilingual title/definition and audio-state paths are not fully captured.
4. **Human and owner review:** strict named-human review and owner acceptance are both pending. The project user's current JavaScript output approval is preserved but is neither gate.

## Completion

- Engineering review: accepted by Codex on 2026-07-21 for the hash-bound child-visual, loop, deterministic-frame, Replay, accessibility, console, asset, and network-QA scope only. Audio, owner, strict-validation, and status-promotion gates are explicitly excluded.
- Human visual review: pending; no named reviewer has signed the complete required frame/diff, bilingual, audio, and interaction scope. The separate current JavaScript output approval remains accepted.
- Owner review: pending.
- Current strict acceptance: consult `reports/pilot-strict-acceptance.json`; at minimum `audio-hash-listening-sync`, `human-review`, `owner-acceptance`, and `strict-validator` remain failed.
- Strict validator: fails closed while status is `blocked`, the Spanish narration source is missing, authoritative listening/host traversal/synchronization is incomplete, strict human and owner reviews are pending, and checklist items remain open.
- Publication: prohibited; the item remains outside the strict public library.
