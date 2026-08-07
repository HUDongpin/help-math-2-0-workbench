# G4 L3 TS006 exact-PID implementation comparison v13

Status: **acceptance-neutral diagnostic layout-convergence probe; not an authoritative baseline, geometry calibration, fidelity acceptance, strict completion, or release evidence**.

## Bounded candidate increment

- The diagnostic-composite path changes only ten source-structural control/title placement or size values within the declared 0.25–2 px search bounds.
- The v12 sRGB color projection and progress geometry are unchanged.
- The source-static path is unchanged, and no full-frame or region-strip implementation image was introduced.
- This is an empirical diagnostic layout fit, not measured original-runtime geometry telemetry.

## Capture-path color diagnostic

With the pointer parked, two 14-frame, zero-drop, silent captures of the same Flash PID/window produced different colors. The window-ID path sampled body/footer as `#b8d8f7`/`#1457c7`; the display exact-PID path sampled `#c2ddfa`/`#1e64d2`, matching the earlier exact-PID source diagnostic at those points. Therefore the window-ID path cannot substitute for display exact-PID runtime color evidence. Both packages remain raw, unpromoted diagnostics with strict acceptance effect `none`.

## Fixed-coordinate RMSE

All RGB pixels remain included at fixed (0,0) registration. There is no post-capture registration search, resampling, clipping, exclusion rectangle, or pixel mask; the bounded implementation-layout search is recorded above. The source/candidate frame pairs remain tentative diagnostic anchors, not source-playhead telemetry.

| Candidate | Source ordinal | Progress px | Kind | Full | Body | Header | Footer |
|---:|---:|---:|---|---:|---:|---:|---:|
| 1 | 18 | 0 | static | 0.057019 | 0.037616 | 0.045885 | 0.122190 |
| 8 | 31 | 4 | transition | 0.058059 | 0.038840 | 0.045885 | 0.123948 |
| 13 | 38 | 7 | transition | 0.071036 | 0.063185 | 0.045885 | 0.122446 |
| 55 | 120 | 41 | transition | 0.068978 | 0.059419 | 0.045885 | 0.123473 |
| 58 | 125 | 43 | transition | 0.073411 | 0.067071 | 0.045885 | 0.122193 |
| 74 | 156 | 55 | transition | 0.075198 | 0.069831 | 0.045885 | 0.122308 |
| 77 | 161 | 57 | transition | 0.103693 | 0.110316 | 0.045885 | 0.123621 |
| 125 | 253 | 94 | transition | 0.108711 | 0.116987 | 0.045885 | 0.124084 |
| 127 | 261 | 97 | transition | 0.111452 | 0.120929 | 0.045885 | 0.122584 |
| 128 | 262 | 98 | static | 0.111849 | 0.121409 | 0.045885 | 0.122844 |

## Summary

- full: mean 0.083941; max 0.111849; v12-to-v13 mean reduction 0.002070 (2.41%)
- header: mean 0.045885; max 0.045885; v12-to-v13 mean reduction 0.012637 (21.59%)
- body: mean 0.080560; max 0.121409; v12-to-v13 mean reduction 0.000000 (0.00%)
- footer: mean 0.122969; max 0.124084; v12-to-v13 mean reduction 0.002965 (2.35%)

- Canonical fixed-RGB full-frame mean: 0.083941
- Four-channel RGBA diagnostic mean: 0.072950 (frame 1 0.049732; frame 128 0.097044). This reproduces the approximate independent ImageMagick scale but is not the acceptance metric.
- Informational full-frame threshold passes: 5/10
- Browser capture: clean
- Strict acceptance effect: **none**

## Unresolved acceptance gates

- The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.
- The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.
- Ten spot frames do not establish complete 128-frame coverage or transition timing parity.
- The bounded layout fit is an empirical diagnostic; no original-runtime geometry telemetry or authoritative placement calibration has been established.
- The sRGB gamma projection is an empirical diagnostic fit; no original-runtime color pipeline or display-transfer telemetry has been established.
- Static full-frame RMSE remains above 0.05, so this diagnostic cannot establish visual fidelity.
- Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, and strict completion remain open.
