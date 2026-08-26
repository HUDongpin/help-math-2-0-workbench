# G4 L3 TS006 exact-PID implementation comparison v14

Status: **acceptance-neutral current-JavaScript diagnostic; not an authoritative baseline, page-ordinal interpretation, fidelity acceptance, strict completion, or release evidence**.

## Bounded renderer increment

- Added the eight observed footer status blocks at the exact diagnostic coordinates and output sRGB colors. The active/page ordinal remains explicitly unresolved; no ordinal semantics were inferred.
- Changed only the diagnostic frame-128 table patch source fill from `#fff8f8` to the source-static panel fill `#fff5f4`.
- No full-frame or region image was introduced. Root/nested domains, one-indexed frames, color calibration, progress geometry, and the source-static path are unchanged.

## Fixed-registration, zero-mask RGB RMSE

Every RGB pixel is compared at fixed (0,0) registration. No translation search, resampling, clipping, exclusion rectangle, alpha mask, or spatial mask is applied. The source/candidate pairs remain tentative diagnostic anchors rather than source-playhead telemetry.

| Candidate | Source ordinal | Kind | Full | Body | Header | Footer | Full reduction | Footer reduction |
|---:|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | 18 | static | 0.045149 | 0.037517 | 0.045885 | 0.073460 | 0.011871 | 0.048730 |
| 8 | 31 | transition | 0.046485 | 0.038796 | 0.045885 | 0.076348 | 0.011574 | 0.047600 |
| 13 | 38 | transition | 0.061841 | 0.063023 | 0.045885 | 0.073884 | 0.009195 | 0.048561 |
| 55 | 120 | transition | 0.059489 | 0.059281 | 0.045885 | 0.075575 | 0.009489 | 0.047898 |
| 58 | 125 | transition | 0.064577 | 0.066948 | 0.045885 | 0.073464 | 0.008835 | 0.048728 |
| 74 | 156 | transition | 0.066601 | 0.069713 | 0.045885 | 0.073655 | 0.008597 | 0.048652 |
| 77 | 161 | transition | 0.097638 | 0.110241 | 0.045885 | 0.075816 | 0.006055 | 0.047805 |
| 125 | 253 | transition | 0.102952 | 0.116916 | 0.045885 | 0.076569 | 0.005759 | 0.047515 |
| 127 | 261 | transition | 0.105842 | 0.120861 | 0.045885 | 0.074113 | 0.005610 | 0.048471 |
| 128 | 262 | static | 0.106260 | 0.121341 | 0.045885 | 0.074543 | 0.005589 | 0.048301 |

## Summary

- full: mean 0.075683; max 0.106260; v13-to-v14 reduction 0.008258 (9.84%)
- header: mean 0.045885; max 0.045885; v13-to-v14 reduction 0.000000 (0.00%)
- body: mean 0.080464; max 0.121341; v13-to-v14 reduction 0.000097 (0.12%)
- footer: mean 0.074743; max 0.076569; v13-to-v14 reduction 0.048226 (39.22%)

- Per-frame non-regression: 10/10 across full, body, header, and footer.
- Browser capture: clean
- Strict acceptance effect: **none**

## Unresolved acceptance gates

- The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.
- The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.
- The eight observed block colors and positions do not establish an active page ordinal, page-number mapping, or navigation semantics.
- Ten spot frames do not establish complete 128-frame coverage or transition timing parity.
- The sRGB gamma projection is an empirical diagnostic fit; no original-runtime color pipeline or display-transfer telemetry has been established.
- Static full-frame RMSE remains above 0.05 for frame 128, so this diagnostic cannot establish visual fidelity.
- Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, and strict completion remain open.
