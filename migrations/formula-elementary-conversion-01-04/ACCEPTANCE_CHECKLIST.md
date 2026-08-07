# formula-elementary-conversion-01-04 Acceptance Checklist

## Source Preservation

- [x] Original FLA/SWF files are preserved byte-for-byte under `source-assets/`.
- [x] SHA-256 hashes and provenance are recorded in `migration.json`.
- [x] `assetId` equals `swf-<full SHA-256>` and every placement has a stable `animationId`.
- [x] Alias and variant relationships preserve every original source placement.
- [x] Missing or unreadable sources are documented; this canonical formula placement has no missing FLA/SWF.
- [x] Legacy network endpoints and external dependencies are inventoried without exposing secrets.

## Audit

- [x] Stage size, background, FPS, frame count, duration, SWF version, and ActionScript version are verified.
- [x] Symbols, depths, masks, morphs, filters, matrices, and color transforms are audited.
- [x] Scripts, labels, stops, buttons, Replay, and other interactions are audited.
- [x] Fonts, glyphs, exact strings, language variants, audio, and video are structurally audited.
- [x] Tool versions and unavailable forensic capabilities are recorded.
- [x] Classification, raw/display titles, grade/lesson/section/page, domain, evidence, and confidence are recorded.

## Baseline

- [x] A hash-bound Adobe Flash Player standalone English baseline is identified and versioned.
- [x] Frame 1, transition boundaries, text/count changes, final frame, and Replay are listed in `keyframes.csv`.
- [x] Native-size baseline images exist for every listed English keyframe.
- [x] Every listed baseline, implementation, diff, capture-manifest, metrics, asset, and audio checksum verifies.
- [x] Emulator differences, the source-composited Spanish child baseline, and its original-host authority boundary are documented.

## Implementation

- [x] Renderer choice and rejected alternatives are justified.
- [x] Native stage coordinates and aspect ratio are preserved.
- [x] Timeline state is implemented as pure queryable JavaScript.
- [x] Exact-frame deterministic capture mode is implemented.
- [x] Scenario, language, and seed modes are deterministic.
- [x] The stage reports the requested one-indexed frame through `data-flash-frame`.
- [x] Extracted/redrawn/generated assets are listed in `asset-inventory.csv`.
- [x] Text, labels, numbers, and formulas stay within their intended objects in tested layouts.
- [x] Replay resets to frame 1 and reproduces the same timeline.
- [x] The modern implementation does not depend on the SWF or Ruffle.

## Verification

- [x] Metadata and required timeline beats have automated tests.
- [x] Implementation language variants, boundary frames, completion, and Replay have automated tests.
- [x] The child SWF's complete reachable default scenario has authoritative frame 1-through-terminal English and Spanish visual coverage; original-host traversal remains separately unclaimed.
- [x] All repository tests pass in the final evidence run (`npm test`: 173/173).
- [x] Production build passes in the final evidence run.
- [x] Implementation images exist for every English and Spanish child-visual frame.
- [x] Diff images and normalized RMSE values exist for every English and Spanish child-visual frame.
- [x] English and Spanish static frames meet RMSE `<= 0.05`.
- [x] English and Spanish transition frames meet RMSE `<= 0.08`.
- [ ] Every diff image received signed human visual review.
- [x] English and Spanish canonical full-frame capture manifests report zero console errors, failed requests, HTTP errors, and unexpected network calls.
- [x] English and Spanish capture PNG files decode and match the native stage at device scale 1.

## Product Quality

- [x] Native, desktop, tablet, and narrow layouts have no tested clipping or horizontal overflow.
- [x] Replay works with mouse, Enter, and Space.
- [x] Accessible names and focus behavior are verified.
- [x] Reduced-motion behavior intentionally freezes at frame 1 and is verified.
- [ ] Original-host English/Spanish visual and audio localization parity is verified.
- [x] A standalone package is not required for this Next.js delivery; any existing legacy package is not acceptance evidence.

## Handoff

- [x] `MIGRATION_BRIEF.md`, `migration.json`, CSV inventories, and evidence paths are populated.
- [x] No accepted exceptions hide the explicit original-host, audio-listening, human, or owner gates.
- [ ] Engineering and human visual reviews both include reviewer identity and review date.
- [ ] Owner acceptance includes reviewer/date, or an authorized `not-required` decision.
- [ ] Strict migration validator passes.
- [x] Final verification report lists source hashes, route, tests, build, keyframes, RMSE, and remaining gates.
- [ ] Owner review is accepted or explicitly marked not required.
