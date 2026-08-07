# G4 L3 TS006 diagnostic-composite comparison

This report compares a browser engineering candidate with manually annotated frames from an unpromoted English Flash Player diagnostic. It is useful for iteration only and has no strict-acceptance effect.

## Result

- Compared keyframes: 10
- Normalized RMSE mean: 0.126965
- Normalized RMSE min/max: 0.103954 / 0.148782
- Static threshold passes: 0/2
- Transition target passes: 0/8
- Strict acceptance effect: **none**

| Source frame | Diagnostic capture ordinal | Kind | RMSE | Mismatch ratio |
|---:|---:|---|---:|---:|
| 1 | 2032 | static | 0.103954 | 0.063090 |
| 8 | 2045 | transition | 0.104471 | 0.066544 |
| 13 | 2054 | transition | 0.115647 | 0.069429 |
| 55 | 2134 | transition | 0.116021 | 0.071917 |
| 58 | 2140 | transition | 0.118844 | 0.073054 |
| 74 | 2170 | transition | 0.120262 | 0.084788 |
| 77 | 2176 | transition | 0.146231 | 0.097040 |
| 125 | 2267 | transition | 0.146714 | 0.100581 |
| 127 | 2271 | transition | 0.148724 | 0.099933 |
| 128 | 2272 | static | 0.148782 | 0.100062 |

## Boundary

The frame pairing is a manual diagnostic calibration, not an authoritative source-frame mapping. EN/ES independent promotable captures, audio timing and listening review, full 128-frame identity-aligned comparison, independent human review, Owner acceptance, and strict completion remain pending.
