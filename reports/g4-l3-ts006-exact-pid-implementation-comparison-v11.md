# G4 L3 TS006 exact-PID implementation comparison v11

Status: **acceptance-neutral footer-convergence diagnostic; not an authoritative baseline, fidelity acceptance, strict completion, or release evidence**.

## Bounded candidate increment

- Spanish page-audio control moved left 4 px and up 3 px.
- Terminal-like candidate frame 128 keeps the pause visual.
- The progress fill uses `#28A4FF` and the hash-bound source-structural sprite-112 thumb.
- No full-frame or footer-strip implementation image was introduced.

## Fixed-coordinate RMSE

All RGB pixels remain included at fixed (0,0) registration. There is no translation search, resampling, clipping, exclusion rectangle, or pixel mask. The source/candidate frame pairs remain tentative diagnostic anchors, not source-playhead telemetry.

| Candidate | Source ordinal | Progress px | Kind | Full | Body | Header | Footer |
|---:|---:|---:|---|---:|---:|---:|---:|
| 1 | 18 | 0 | static | 0.065991 | 0.044429 | 0.069102 | 0.129578 |
| 8 | 31 | 4 | transition | 0.067034 | 0.045819 | 0.069102 | 0.131143 |
| 13 | 38 | 7 | transition | 0.078816 | 0.068227 | 0.069102 | 0.129524 |
| 55 | 120 | 41 | transition | 0.076887 | 0.064529 | 0.069102 | 0.130741 |
| 58 | 125 | 43 | transition | 0.080900 | 0.071681 | 0.069102 | 0.129460 |
| 74 | 156 | 55 | transition | 0.083052 | 0.075123 | 0.069102 | 0.129530 |
| 77 | 161 | 57 | transition | 0.109755 | 0.114068 | 0.069102 | 0.130750 |
| 125 | 253 | 94 | transition | 0.114254 | 0.120143 | 0.069102 | 0.131392 |
| 127 | 261 | 97 | transition | 0.116751 | 0.123867 | 0.069102 | 0.129777 |
| 128 | 262 | 98 | static | 0.117120 | 0.124341 | 0.069102 | 0.129929 |

## Summary

- full: mean 0.091056; max 0.117120; v10-to-v11 mean reduction 0.003992 (4.20%)
- header: mean 0.069102; max 0.069102; v10-to-v11 mean reduction 0.017607 (20.31%)
- body: mean 0.085223; max 0.124341; v10-to-v11 mean reduction 0.000033 (0.04%)
- footer: mean 0.130182; max 0.131392; v10-to-v11 mean reduction 0.005938 (4.36%)

- Informational full-frame threshold passes: 3/10
- Browser capture: clean
- Strict acceptance effect: **none**

## Unresolved acceptance gates

- The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.
- The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.
- Ten spot frames do not establish complete 128-frame coverage or transition timing parity.
- Static full-frame RMSE remains above 0.05, so this diagnostic cannot establish visual fidelity.
- Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, and strict completion remain open.
