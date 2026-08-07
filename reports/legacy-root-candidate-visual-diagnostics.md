# Legacy Adobe root vs current JavaScript: candidate-only diagnostics

> This is an engineering diagnostic only. The schema-v1 Adobe standalone reports are not current coverage-v2 trace-bound baseline authority. Nothing here changes coverage, acceptance, human review, owner review, migration status, or strict completion.

- Animations: 7
- Exact 800x600 frame pairs: 115/115
- Numeric RMSE passes: 115/115
- Numeric threshold failures: 0
- Near-threshold review outliers (>= 0.045): 0
- Independent semantic-risk frames: 0
- Numeric RMSE range: 0.000000–0.038433
- Candidate visual acceptance: **not granted**

## Per-animation results

| Animation | Frames | RMSE max | <= threshold | Exact RGB | Semantic risks |
|---|---:|---:|---:|---:|---:|
| course-g03-l01-ts-008 | 10 | 0.000000 | 10/10 | 10/10 | 0 |
| course-g03-l01-vb-004 | 10 | 0.034008 | 10/10 | 0/10 | 0 |
| course-g03-l06-fq-002-review | 10 | 0.000000 | 10/10 | 10/10 | 0 |
| course-g03-l08-re-001 | 55 | 0.038433 | 55/55 | 0/55 | 0 |
| course-g04-l01-ir-001 | 10 | 0.000000 | 10/10 | 10/10 | 0 |
| course-g04-l03-in-009 | 10 | 0.000000 | 10/10 | 10/10 | 0 |
| course-g05-l13-rw-002 | 10 | 0.000000 | 10/10 | 10/10 | 0 |

## Largest mismatch groups

- course-g03-l08-re-001: 0.038433 at 55 frames (1–55)
- course-g03-l01-vb-004: 0.034008 at frame 10; 0.033843 at frame 9; 0.033254 at frame 8; 0.032856 at frame 7

## Independent semantic checks

- formula: not-automatable-no-declared-semantic-region; 0 risk finding(s) across 0 configured region-frame evaluation(s).
- text: no-large-signal-occupancy-loss-detected; 0 risk finding(s) across 4 configured region-frame evaluation(s).
- label: no-large-signal-occupancy-loss-detected; 0 risk finding(s) across 59 configured region-frame evaluation(s).
- layer: no-large-signal-occupancy-loss-detected; 0 risk finding(s) across 4 configured region-frame evaluation(s).

## Review artifacts

- Diff archive: `artifacts/full-frame/candidate-diagnostics/legacy-adobe-root-vs-current-js/49a41b2382da0498ba06`
- Selected review frames: 2
- Contact-sheet pages: 1
  - `artifacts/full-frame/candidate-diagnostics/legacy-adobe-root-vs-current-js/49a41b2382da0498ba06/contact-sheets/page-01.png` (SHA-256 `d1a26c597d9121731d7384a2844cc17b53d866c5ce01c07cc4c79b175879cef4`)

## Evidence boundary

- The old Adobe reports remain useful hash-bound standalone visual inputs, but their schema does not bind the current requirement, trace, entry state, scenario, and execution evidence required by coverage-v2.
- A frame can pass aggregate RMSE while containing a serious text, number, formula, label, or layering defect; the separate region checks prevent numeric threshold passage from silently deciding those categories.
- Raster occupancy can detect large missing-content risk in configured regions; it cannot prove wording, formulas, font fidelity, depth order, interaction behavior, audio, or natural runtime execution. Named human review remains required.

