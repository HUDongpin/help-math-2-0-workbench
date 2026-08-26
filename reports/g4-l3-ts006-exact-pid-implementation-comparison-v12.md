# G4 L3 TS006 exact-PID implementation comparison v12

Status: **acceptance-neutral diagnostic color-convergence probe; not an authoritative baseline, color-pipeline calibration, fidelity acceptance, strict completion, or release evidence**.

## Bounded candidate increment

- The diagnostic-composite path applies an sRGB SVG `feComponentTransfer` gamma exponent of `5/6` independently to red, green, and blue.
- The transfer is `C_out = C_in^(1/1.2)`; amplitude is 1 and offset is 0.
- The source-static path is unchanged, and no full-frame or region-strip implementation image was introduced.
- This is an empirical diagnostic projection, not measured original-runtime color telemetry.

## Capture-path color diagnostic

With the pointer parked, two 14-frame, zero-drop, silent captures of the same Flash PID/window produced different colors. The window-ID path sampled body/footer as `#b8d8f7`/`#1457c7`; the display exact-PID path sampled `#c2ddfa`/`#1e64d2`, matching the earlier exact-PID source diagnostic at those points. Therefore the window-ID path cannot substitute for display exact-PID runtime color evidence. Both packages remain raw, unpromoted diagnostics with strict acceptance effect `none`.

## Fixed-coordinate RMSE

All RGB pixels remain included at fixed (0,0) registration. There is no translation search, resampling, clipping, exclusion rectangle, or pixel mask. The source/candidate frame pairs remain tentative diagnostic anchors, not source-playhead telemetry.

| Candidate | Source ordinal | Progress px | Kind | Full | Body | Header | Footer |
|---:|---:|---:|---|---:|---:|---:|---:|
| 1 | 18 | 0 | static | 0.059858 | 0.037616 | 0.058522 | 0.125197 |
| 8 | 31 | 4 | transition | 0.060854 | 0.038840 | 0.058522 | 0.126931 |
| 13 | 38 | 7 | transition | 0.073323 | 0.063185 | 0.058522 | 0.125396 |
| 55 | 120 | 41 | transition | 0.071345 | 0.059419 | 0.058522 | 0.126460 |
| 58 | 125 | 43 | transition | 0.075629 | 0.067071 | 0.058522 | 0.125160 |
| 74 | 156 | 55 | transition | 0.077362 | 0.069831 | 0.058522 | 0.125264 |
| 77 | 161 | 57 | transition | 0.105279 | 0.110316 | 0.058522 | 0.126584 |
| 125 | 253 | 94 | transition | 0.110228 | 0.116987 | 0.058522 | 0.127056 |
| 127 | 261 | 97 | transition | 0.112922 | 0.120929 | 0.058522 | 0.125522 |
| 128 | 262 | 98 | static | 0.113313 | 0.121409 | 0.058522 | 0.125765 |

## Summary

- full: mean 0.086011; max 0.113313; v11-to-v12 mean reduction 0.005045 (5.54%)
- header: mean 0.058522; max 0.058522; v11-to-v12 mean reduction 0.010579 (15.31%)
- body: mean 0.080560; max 0.121409; v11-to-v12 mean reduction 0.004662 (5.47%)
- footer: mean 0.125934; max 0.127056; v11-to-v12 mean reduction 0.004249 (3.26%)

- Canonical fixed-RGB full-frame mean: 0.086011
- Four-channel RGBA diagnostic mean: 0.074735 (frame 1 0.052173; frame 128 0.098309). This reproduces the approximate independent ImageMagick scale but is not the acceptance metric.
- Informational full-frame threshold passes: 5/10
- Browser capture: clean
- Strict acceptance effect: **none**

## Unresolved acceptance gates

- The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.
- The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.
- Ten spot frames do not establish complete 128-frame coverage or transition timing parity.
- The sRGB gamma projection is an empirical diagnostic fit; no original-runtime color pipeline or display-transfer telemetry has been established.
- Static full-frame RMSE remains above 0.05, so this diagnostic cannot establish visual fidelity.
- Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, and strict completion remain open.
