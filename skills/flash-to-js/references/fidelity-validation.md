# Fidelity Validation

Use native-size deterministic captures and pair quantitative comparison with visual inspection. A low aggregate error can still hide a wrong formula, button, or event frame.

## Capture Protocol

Keep these values identical between baseline and implementation:

- Native stage width and height.
- Device scale factor, normally `1` for pixel comparison.
- Browser/Ruffle renderer and version.
- Background color and transparency.
- Font/glyph source and loading state.
- One-indexed frame number.
- Cropping rectangle and page padding.

Capture at least:

- Frame 1.
- Start and end of every tween or morph.
- Boundary frames where layers overlap, appear, or disappear.
- Every text, number, formula, language, or counter change.
- Every interaction state.
- Final frame and Replay state.

Use filenames such as `frame-001.png`, `frame-025.png`, and `frame-109.png` in both baseline and implementation directories.

## Deterministic Implementation Capture

Expose a non-production-affecting query parameter such as `?frame=25`. It must derive the same state as normal playback and freeze animation at that exact frame. Add `data-flash-frame="25"` to the captured stage wrapper so the capture script can verify the requested frame.

Run:

```bash
npm run capture:keyframes -- \
  --url http://127.0.0.1:3000/conversion-1-2 \
  --frames 1,5,10,19,25,35,49,55,68,75,88,100,109 \
  --selector .faithful-stage-wrap \
  --output migrations/Conversion_1_2/evidence/implementation
```

## Pixel Comparison

Run the portable Node comparator:

```bash
npm run compare:frames -- \
  migrations/Animation/baseline/keyframes/frame-025.png \
  migrations/Animation/evidence/implementation/frame-025.png \
  --diff migrations/Animation/evidence/diffs/frame-025.png \
  --json migrations/Animation/evidence/diffs/frame-025.json \
  --max-rmse 0.05
```

Normalized RGB RMSE is:

`sqrt(mean((baselineChannel - implementationChannel)^2)) / 255`

Use these default review gates:

- Static/key teaching frames: normalized RMSE `<= 0.05`.
- Transitional frames with renderer-specific antialiasing: target `<= 0.08`.
- Timing: exact source frame; allow at most one frame only with a documented scheduler or baseline limitation.
- Dimensions: exact pixel match before comparison.

These are review thresholds, not permission to ignore obvious errors. A formula, count, label, button, or major object must never be wrong even when aggregate RMSE passes.

When the owner accepts a justified exception, add it to `migration.json` under `acceptance.knownExceptions` and use `accepted-exception` in the affected CSV result field. Never use that value without a written exception.

## Visual Review

Inspect every diff for:

- Whole-stage translation or scaling.
- Wrong registration point, matrix, rotation, or depth order.
- Missing masks, filters, highlights, shadows, or morph states.
- Font substitution, baseline shift, glyph spacing, or clipped text.
- Wrong alpha or color transform.
- Background and stage-crop differences.
- Unexpected Ruffle overlays or browser UI.

Record accepted antialiasing differences separately from behavioral or layout discrepancies.

## Interaction And Responsive Review

Verify:

- Replay restarts at frame 1 with mouse, Enter, and Space.
- Focus order and accessible control names are meaningful.
- `prefers-reduced-motion` has an intentional behavior.
- Native stage, wide desktop, tablet, and narrow mobile layouts do not crop or overlap.
- Text and numeric labels remain inside their intended objects.
- No console errors, failed assets, accidental network calls, or layout shifts occur.

## Evidence Table

For each row in `keyframes.csv`, record baseline file, implementation file, diff file, normalized RMSE, timing result, visual result, reviewer, and notes. Complete the acceptance checklist only after every required row has evidence.
