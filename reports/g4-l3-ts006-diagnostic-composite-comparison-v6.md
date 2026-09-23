# G4 L3 TS006 diagnostic-composite comparison

This report compares a browser engineering candidate with manually annotated frames from an unpromoted English Flash Player diagnostic. It is useful for iteration only and has no strict-acceptance effect.

## Result

- Compared keyframes: 10
- Normalized RMSE mean: 0.109830
- Normalized RMSE min/max: 0.086144 / 0.133030
- Static threshold passes: 0/2
- Transition target passes: 0/8
- Strict acceptance effect: **none**

| Source frame | Diagnostic capture ordinal | Kind | RMSE | Mismatch ratio |
|---:|---:|---|---:|---:|
| 1 | 2032 | static | 0.086144 | 0.046944 |
| 8 | 2045 | transition | 0.087039 | 0.049596 |
| 13 | 2054 | transition | 0.097858 | 0.052117 |
| 55 | 2134 | transition | 0.097652 | 0.054221 |
| 58 | 2140 | transition | 0.100791 | 0.055360 |
| 74 | 2170 | transition | 0.102202 | 0.066275 |
| 77 | 2176 | transition | 0.130356 | 0.078040 |
| 125 | 2267 | transition | 0.130368 | 0.080988 |
| 127 | 2271 | transition | 0.132863 | 0.080733 |
| 128 | 2272 | static | 0.133030 | 0.080900 |

## Boundary

The frame pairing is a manual diagnostic calibration, not an authoritative source-frame mapping. EN/ES independent promotable captures, audio timing and listening review, full 128-frame identity-aligned comparison, independent human review, Owner acceptance, and strict completion remain pending.
