# course-g03-l06-fq-002-review Acceptance Checklist

## Source Preservation

- [ ] Original FLA/SWF files are preserved byte-for-byte under `source-assets/`.
- [ ] SHA-256 hashes and provenance are recorded in `migration.json`.
- [ ] `assetId` equals `swf-<full SHA-256>` and every placement has a stable `animationId`.
- [ ] Alias and variant relationships preserve every original source placement.
- [ ] Missing or unreadable sources are documented.
- [ ] Legacy network endpoints and external dependencies are inventoried without exposing secrets.

## Audit

- [ ] Stage size, background, FPS, frame count, duration, SWF version, and ActionScript version are verified.
- [ ] Symbols, depths, masks, morphs, filters, matrices, and color transforms are audited.
- [ ] Scripts, labels, stops, buttons, Replay, and other interactions are audited.
- [ ] Fonts, glyphs, exact strings, language variants, audio, and video are audited.
- [ ] Tool versions and unavailable forensic capabilities are recorded.
- [ ] Classification, raw/display titles, grade/lesson/section/page, domain, evidence, and confidence are recorded.

## Baseline

- [ ] An independent original/Ruffle/Animate baseline is identified and versioned.
- [ ] Frame 1, all transition boundaries, text/count changes, interactions, final frame, and Replay are listed in `keyframes.csv`.
- [ ] Native-size baseline images exist for every required keyframe.
- [ ] Every baseline, implementation, diff, capture-manifest, metrics, asset, and audio checksum verifies.
- [ ] Emulator differences and evidence conflicts are documented.

## Implementation

- [ ] Renderer choice and rejected alternatives are justified.
- [ ] Native stage coordinates and aspect ratio are preserved.
- [ ] Timeline state is implemented as pure queryable JavaScript.
- [ ] Exact-frame deterministic capture mode is implemented.
- [ ] Scenario, language, and seed capture modes are deterministic.
- [ ] The stage always reports the requested one-indexed frame through `data-flash-frame`.
- [ ] Extracted/redrawn/generated assets are listed in `asset-inventory.csv`.
- [ ] Text, labels, numbers, and formulas stay within their intended objects.
- [ ] Replay resets to frame 1 and reproduces the same timeline.
- [ ] The modern implementation does not depend on the SWF or Ruffle unless explicitly approved.

## Verification

- [ ] Metadata and every required timeline beat have automated tests.
- [ ] Language variants, boundary frames, completion, and Replay have automated tests.
- [ ] Every reachable scenario and every language has complete frame 1-through-terminal coverage.
- [ ] All tests pass.
- [ ] Production build passes.
- [ ] Implementation images exist for every required keyframe.
- [ ] Diff images and normalized RMSE values exist for every required keyframe.
- [ ] Static keyframes meet RMSE `<= 0.05` or have an accepted written exception.
- [ ] Transition keyframes meet RMSE `<= 0.08` or have an accepted written exception.
- [ ] Every diff image received human visual review.
- [ ] The full-frame capture manifest reports zero console errors, failed requests, HTTP errors, and unexpected network calls.
- [ ] Capture PNG files decode and match the native stage dimensions at device scale 1.

## Product Quality

- [ ] Native, desktop, tablet, and mobile layouts have no clipping or overlap.
- [ ] Replay works with mouse, Enter, and Space.
- [ ] Accessible names and focus behavior are verified.
- [ ] Reduced-motion behavior is intentional and verified.
- [ ] English/Spanish or other required localization is verified.
- [ ] Standalone package works offline when one is required.

## Handoff

- [ ] `MIGRATION_BRIEF.md`, `migration.json`, CSV inventories, and evidence paths are complete.
- [ ] Known exceptions and owner decisions are explicit.
- [ ] Engineering and human visual reviews include reviewer identity and review date.
- [ ] Owner acceptance includes reviewer/date, or `not-required` includes an explicit reason.
- [ ] Strict migration validator passes.
- [ ] Final report lists source hashes, route, package, tests, build, keyframes, RMSE, and exceptions.
- [ ] Owner review is accepted or explicitly marked not required.
