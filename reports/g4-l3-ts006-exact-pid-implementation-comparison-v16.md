# G4 L3 TS006 exact-PID implementation comparison v16

Status: **acceptance-neutral progress-color diagnostic; not an authoritative baseline, fidelity acceptance, strict completion, or release evidence**.

v16 changes only the progress rectangle inputs inside the existing gamma filter: semantic output fill/track remain `#28A4FF`/`#717171`, while filter inputs are `#1C96FF`/`#606060`. The thumb, progress mapping, body, table, assets, coverage, ledgers, review, and release state are unchanged.

## Fixed-registration, zero-mask results

| Candidate | Source ordinal | Full | Header | Body | Footer | Progress rect | v15→v16 changed pixels | Outside progress rect |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 18 | 0.045071 | 0.045885 | 0.037517 | 0.073084 | 0.011157 | 872 | 0 |
| 8 | 31 | 0.046405 | 0.045885 | 0.038796 | 0.075963 | 0.091646 | 848 | 0 |
| 13 | 38 | 0.061782 | 0.045885 | 0.063023 | 0.073494 | 0.092427 | 848 | 0 |
| 55 | 120 | 0.059441 | 0.045885 | 0.059281 | 0.075276 | 0.096251 | 848 | 0 |
| 58 | 125 | 0.064533 | 0.045885 | 0.066948 | 0.073162 | 0.096748 | 848 | 0 |
| 74 | 156 | 0.066563 | 0.045885 | 0.069713 | 0.073385 | 0.104152 | 861 | 13 |
| 77 | 161 | 0.097613 | 0.045885 | 0.110241 | 0.075559 | 0.104612 | 862 | 14 |
| 125 | 253 | 0.102936 | 0.045885 | 0.116916 | 0.076404 | 0.112776 | 862 | 14 |
| 127 | 261 | 0.105827 | 0.045885 | 0.120861 | 0.073950 | 0.113413 | 862 | 14 |
| 128 | 262 | 0.106246 | 0.045885 | 0.121341 | 0.074384 | 0.109538 | 862 | 14 |

## Mean RMSE change from v15

- full: v15 0.075683230305; v16 0.075641807244; change 0.000041423061 (0.054732%)
- header: v15 0.045884873810; v16 0.045884873810; change 0.000000000000 (0.000000%)
- body: v15 0.080463607541; v16 0.080463650384; change -0.000000042843 (-0.000053%)
- footer: v15 0.074742635343; v16 0.074466203496; change 0.000276431847 (0.369845%)
- progressRect: v15 0.109135803913; v16 0.093271873975; change 0.015863929938 (14.535954%)
- progressWide: v15 0.086185077283; v16 0.080213961063; change 0.005971116220 (6.928248%)

- Full/header/footer/progress non-regression: verified for all 10 frames.
- Body: five frames are pixel-identical; the other five differ by 13–14 antialiased edge pixels, each by at most 5 channel levels. Mean body RMSE changes by -0.000000042843 (-0.000053%). This is recorded as bounded filter-compositing quantization, not hidden as pixel identity.
- Browser capture and current implementation artifact closure: verified.
- Strict acceptance effect: **none**.

## Open gates

- The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.
- The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.
- The observed progress colors support this diagnostic inverse-gamma input only; they do not establish the original runtime color pipeline.
- Ten spot frames do not establish complete 128-frame coverage or transition timing parity.
- Five later frames contain 13-14 whitelisted body antialias edge pixels changed by at most five channel levels after filtered progress recomposition; this is disclosed rather than treated as pixel identity.
- Static full-frame RMSE remains above 0.05 for frame 128, so this diagnostic cannot establish visual fidelity.
- The frozen global current-JavaScript candidate and workspace-binding reports were intentionally not refreshed during concurrent work.
- Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, strict completion, and atomic lesson release remain open.
