# G4 L3 TS006 diagnostic-composite comparison

This report compares a browser engineering candidate with manually annotated frames from an unpromoted English Flash Player diagnostic. It is useful for iteration only and has no strict-acceptance effect.

## Result

- Compared keyframes: 10
- Normalized RMSE mean: 0.094485
- Normalized RMSE min/max: 0.070711 / 0.118919
- Static threshold passes: 0/2
- Transition target passes: 1/8
- Strict acceptance effect: **none**

| Source frame | Diagnostic capture ordinal | Kind | RMSE | Mismatch ratio |
|---:|---:|---|---:|---:|
| 1 | 2032 | static | 0.070711 | 0.040042 |
| 8 | 2045 | transition | 0.071759 | 0.042362 |
| 13 | 2054 | transition | 0.080929 | 0.044267 |
| 55 | 2134 | transition | 0.080711 | 0.046608 |
| 58 | 2140 | transition | 0.084856 | 0.047535 |
| 74 | 2170 | transition | 0.086403 | 0.057742 |
| 77 | 2176 | transition | 0.115953 | 0.069065 |
| 125 | 2267 | transition | 0.115967 | 0.072017 |
| 127 | 2271 | transition | 0.118643 | 0.071727 |
| 128 | 2272 | static | 0.118919 | 0.071923 |

## Boundary

The frame pairing is a manual diagnostic calibration, not an authoritative source-frame mapping. EN/ES independent promotable captures, audio timing and listening review, full 128-frame identity-aligned comparison, independent human review, Owner acceptance, and strict completion remain pending.
