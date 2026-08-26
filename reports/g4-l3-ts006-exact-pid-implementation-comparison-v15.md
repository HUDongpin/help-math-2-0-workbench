# G4 L3 TS006 exact-PID implementation comparison v15

Status: **acceptance-neutral current-implementation recapture diagnostic; not an authoritative baseline, fidelity acceptance, strict completion, or release evidence**.

## Current implementation binding

- Candidate report: `80fbe8cf9b283a0a411477cc6602a1968e4e1af924ce02c93923794751634398`
- Public manifest: `3e53077860ab9e6f9aeea22989770d2605e8ccd8b56e124342cf536a4c8200de`
- Asset inventory: `c65960d0ef5abeac6a7853dcdcc4c1c94e08a5adf6a89ee3b4aa96e9d3488a76`
- Workspace binding: `cca3b07fe65d4b024671dcef27641a2c1115b7ccabcf9e87e62a8a121f72ba6c`
- Reconciliation receipt fingerprint: `fdccc943b42f2456c5aff21d0593d627ac13be538dc2d09cd3ee1b112d731b01`
- The inventory-observer conflict remains preserved. v15 changed no renderer, timeline, inventory, ledger, review, or release state.

## Fixed-registration, zero-mask RGB RMSE

Every RGB pixel is compared at fixed (0,0) registration. No translation search, resampling, clipping, exclusion rectangle, alpha mask, or spatial mask is applied. The ten pairs remain tentative diagnostic anchors rather than source-playhead telemetry. The v15 browser pixels are byte-identical to v14 at all ten frames.

| Candidate | Source ordinal | Kind | Full | Body | Header | Footer | Full reduction vs v14 |
|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | 18 | static | 0.045149 | 0.037517 | 0.045885 | 0.073460 | 0.000000 |
| 8 | 31 | transition | 0.046485 | 0.038796 | 0.045885 | 0.076348 | 0.000000 |
| 13 | 38 | transition | 0.061841 | 0.063023 | 0.045885 | 0.073884 | 0.000000 |
| 55 | 120 | transition | 0.059489 | 0.059281 | 0.045885 | 0.075575 | 0.000000 |
| 58 | 125 | transition | 0.064577 | 0.066948 | 0.045885 | 0.073464 | 0.000000 |
| 74 | 156 | transition | 0.066601 | 0.069713 | 0.045885 | 0.073655 | 0.000000 |
| 77 | 161 | transition | 0.097638 | 0.110241 | 0.045885 | 0.075816 | 0.000000 |
| 125 | 253 | transition | 0.102952 | 0.116916 | 0.045885 | 0.076569 | 0.000000 |
| 127 | 261 | transition | 0.105842 | 0.120861 | 0.045885 | 0.074113 | 0.000000 |
| 128 | 262 | static | 0.106260 | 0.121341 | 0.045885 | 0.074543 | 0.000000 |

## Summary

- full: mean 0.075683; max 0.106260; v14-to-v15 reduction 0.000000 (0.00%)
- header: mean 0.045885; max 0.045885; v14-to-v15 reduction 0.000000 (0.00%)
- body: mean 0.080464; max 0.121341; v14-to-v15 reduction 0.000000 (0.00%)
- footer: mean 0.074743; max 0.076569; v14-to-v15 reduction 0.000000 (0.00%)

- Per-frame non-regression: 10/10 across full, body, header, and footer.
- Browser capture: clean
- Current implementation artifact closure: verified
- Strict acceptance effect: **none**

## Unresolved acceptance gates

- The exact-PID source package remains an acceptance-neutral diagnostic, not an authorized natural runtime trace or authoritative baseline.
- The source-ordinal to candidate-frame pairs remain tentative phase anchors, not source-playhead telemetry or trace-bound source-frame identity.
- The eight observed block colors and positions do not establish an active page ordinal, page-number mapping, or navigation semantics.
- Ten spot frames do not establish complete 128-frame coverage or transition timing parity.
- The sRGB gamma projection is an empirical diagnostic fit; no original-runtime color pipeline or display-transfer telemetry has been established.
- Static full-frame RMSE remains above 0.05 for frame 128, so this diagnostic cannot establish visual fidelity.
- The inventory observer remains intentionally stale relative to the specialized current-JavaScript inventory writer; the immutable reconciliation receipt preserves that conflict without rewriting the observer.
- Audio timing and listening review, an independent Spanish trace, independent human visual review, Owner acceptance, strict completion, and atomic lesson release remain open.
