# G4 L3 TS006 diagnostic-composite comparison

This report compares a browser engineering candidate with manually annotated frames from an unpromoted English Flash Player diagnostic. It is useful for iteration only and has no strict-acceptance effect.

## Result

- Compared keyframes: 10
- Normalized RMSE mean: 0.148409
- Normalized RMSE min/max: 0.128719 / 0.167638
- Static threshold passes: 0/2
- Transition target passes: 0/8
- Strict acceptance effect: **none**

| Source frame | Diagnostic capture ordinal | Kind | RMSE | Mismatch ratio |
|---:|---:|---|---:|---:|
| 1 | 2032 | static | 0.128719 | 0.091260 |
| 8 | 2045 | transition | 0.129145 | 0.095204 |
| 13 | 2054 | transition | 0.138180 | 0.097587 |
| 55 | 2134 | transition | 0.138495 | 0.100096 |
| 58 | 2140 | transition | 0.141068 | 0.101265 |
| 74 | 2170 | transition | 0.142284 | 0.113154 |
| 77 | 2176 | transition | 0.165269 | 0.125567 |
| 125 | 2267 | transition | 0.165738 | 0.128744 |
| 127 | 2271 | transition | 0.167554 | 0.128540 |
| 128 | 2272 | static | 0.167638 | 0.128658 |

## Boundary

The frame pairing is a manual diagnostic calibration, not an authoritative source-frame mapping. EN/ES independent promotable captures, audio timing and listening review, full 128-frame identity-aligned comparison, independent human review, Owner acceptance, and strict completion remain pending.
