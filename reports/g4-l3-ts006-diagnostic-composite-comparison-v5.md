# G4 L3 TS006 diagnostic-composite comparison

This report compares a browser engineering candidate with manually annotated frames from an unpromoted English Flash Player diagnostic. It is useful for iteration only and has no strict-acceptance effect.

## Result

- Compared keyframes: 10
- Normalized RMSE mean: 0.117295
- Normalized RMSE min/max: 0.095211 / 0.139101
- Static threshold passes: 0/2
- Transition target passes: 0/8
- Strict acceptance effect: **none**

| Source frame | Diagnostic capture ordinal | Kind | RMSE | Mismatch ratio |
|---:|---:|---|---:|---:|
| 1 | 2032 | static | 0.095211 | 0.053565 |
| 8 | 2045 | transition | 0.096080 | 0.056308 |
| 13 | 2054 | transition | 0.105984 | 0.058815 |
| 55 | 2134 | transition | 0.105789 | 0.060929 |
| 58 | 2140 | transition | 0.108697 | 0.062071 |
| 74 | 2170 | transition | 0.110007 | 0.072985 |
| 77 | 2176 | transition | 0.136559 | 0.084708 |
| 125 | 2267 | transition | 0.136571 | 0.087700 |
| 127 | 2271 | transition | 0.138945 | 0.087415 |
| 128 | 2272 | static | 0.139101 | 0.087575 |

## Boundary

The frame pairing is a manual diagnostic calibration, not an authoritative source-frame mapping. EN/ES independent promotable captures, audio timing and listening review, full 128-frame identity-aligned comparison, independent human review, Owner acceptance, and strict completion remain pending.
