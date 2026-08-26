# keyterm-elementary-acute-angle Acceptance Checklist

## Source Preservation

- [x] Original FLA/SWF files are preserved byte-for-byte under `source-assets/`.
- [x] SHA-256 hashes and provenance are recorded in `migration.json`.
- [x] `assetId` equals `swf-<full SHA-256>` and every placement has a stable `animationId`.
- [x] Alias and variant relationships preserve every original source placement.
- [x] Missing or unreadable sources are documented.
- [x] Legacy network endpoints and external dependencies are inventoried without exposing secrets.

## Audit

- [x] Stage size, background, FPS, frame count, duration, SWF version, and ActionScript version are verified.
- [ ] Symbols, depths, masks, morphs, filters, matrices, and color transforms are audited.
- [x] Scripts, labels, stops, buttons, Replay, and other interactions are audited.
- [ ] Fonts, glyphs, exact strings, language variants, audio, and video are audited.
- [x] Tool versions and unavailable forensic capabilities are recorded.
- [x] Classification, raw/display titles, grade/lesson/section/page, domain, evidence, and confidence are recorded.

## Baseline

- [x] An independent original/Ruffle/Animate baseline is identified and versioned.
- [ ] Frame 1, all transition boundaries, text/count changes, interactions, final frame, and Replay are listed in `keyframes.csv`.
- [x] Native-size baseline images exist for every required keyframe.
- [x] Every baseline, implementation, diff, capture-manifest, metrics, asset, and available-audio checksum verifies; the absent Spanish source remains separately documented.
- [x] Emulator differences and evidence conflicts are documented.

## Implementation

- [x] Renderer choice and rejected alternatives are justified.
- [x] Native stage coordinates and aspect ratio are preserved.
- [x] Timeline state is implemented as pure queryable JavaScript.
- [x] Exact-frame deterministic capture mode is implemented.
- [x] Scenario, language, and seed capture modes are deterministic.
- [x] The stage always reports the requested one-indexed frame through `data-flash-frame`.
- [x] Extracted/redrawn/generated assets are listed in `asset-inventory.csv`.
- [x] Text, labels, numbers, and formulas stay within their intended objects.
- [x] Replay/reset behavior matches the source timeline: live playback loops 60 → 1 → 2, and mouse/Enter/Space Replay resets to 1 then resumes at 2.
- [x] The modern implementation does not depend on the SWF or Ruffle unless explicitly approved.

## Verification

- [x] Metadata and every required timeline beat have automated tests, including the source 60 → 1 → 2 loop boundary.
- [x] Language variants, boundary frames, completion/loop behavior, deterministic frame freeze, and Replay have automated tests.
- [x] Every reachable scenario and every language has complete frame 1-through-terminal coverage.
- [x] All tests pass.
- [x] Production build passes.
- [x] Implementation images exist for every required keyframe.
- [x] Diff images and normalized RMSE values exist for every required keyframe.
- [x] Static keyframes meet RMSE `<= 0.05` or have an accepted written exception.
- [x] Transition keyframes meet RMSE `<= 0.08` or have an accepted written exception.
- [ ] Every diff image received human visual review.
- [x] The full-frame capture manifest reports zero console errors, failed requests, HTTP errors, and unexpected network calls.
- [x] Capture PNG files decode and match the native stage dimensions at device scale 1.

## Product Quality

- [x] Native, desktop, tablet, and mobile layouts have no clipping or overlap.
- [x] Replay works with mouse, Enter, and Space.
- [x] Accessible names and focus behavior are verified.
- [x] Reduced-motion behavior is intentional and verified.
- [ ] English/Spanish or other required localization is verified.
- [x] Standalone package works offline when one is required.

## Handoff

- [x] `MIGRATION_BRIEF.md`, `migration.json`, CSV inventories, and evidence paths are complete.
- [x] Known exceptions and owner decisions are explicit.
- [ ] Engineering and human visual reviews include reviewer identity and review date.
- [ ] Owner acceptance includes reviewer/date, or `not-required` includes an explicit reason.
- [ ] Strict migration validator passes.
- [x] Final report lists source hashes, route, package, tests, build, keyframes, RMSE, and exceptions.
- [ ] Owner review is accepted or explicitly marked not required.
