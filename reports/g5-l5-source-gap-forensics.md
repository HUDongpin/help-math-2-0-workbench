# lesson-g05-l05-add-subtract-negative-numbers source-gap forensics

> This report reconciles preserved static sources. It cannot establish runtime reachability, recover missing content, change release scope, or grant implementation or acceptance authority.

## Page-set reconciliation

- Active XML pages: **56**; frozen release order matches exactly.
- `MainScript_New.as` `LessonDetails` pages: **62**.
- Extra in `LessonDetails`: **6**; missing from `LessonDetails`: **0**.
- Commented legacy XML pages: **6**.

Extras are static source differences, not proof of student reachability:

- `VB/L5VB01.swf`
- `IN/L5IN01.swf`
- `TI/L5TI01.swf`
- `GS/L5GS01.swf`
- `TS/L5TS01.swf`
- `TS/L5TS09.swf`

| Commented XML path | In LessonDetails | Path-qualified AS reference |
|---|---|---|
| `RW/L5RW01.swf` | no | yes |
| `VB/L5VB01.swf` | yes | yes |
| `IN/L5IN01.swf` | yes | yes |
| `TI/L5TI01.swf` | yes | yes |
| `GS/L5GS01.swf` | yes | yes |
| `TS/L5TS01.swf` | yes | yes |

Use authorized original-shell natural navigation to determine student reachability. Any scope change requires a reviewed new release-manifest version; never silently mutate this release.

## Missing keyterm XML

| Language | Declared path | Physical | Exact catalog matches | Basename matches |
|---|---|---|---:|---:|
| english | `HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTE01.xml` | missing | 0 | 0 |
| spanish | `HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTS01.xml` | missing | 0 | 0 |

MainScript glossary signal lines: 421, 422, 423, 563, 564, 565; shell FFDec keyterms signal lines: 487, 488. These are dependency signals only.

## Blockers

- Authorized original-shell natural navigation has not established whether legacy introduction pages are student-reachable.
- L5KTE01.xml and L5KTS01.xml are absent from the current source catalog and physical preserved source root; their content must not be invented.
- Static ActionScript and FFDec symbol references cannot replace original-runtime behavior, network/file-load observation, bilingual review, or Owner disposition.

No release member, source, migration acceptance field, protected ledger, route, or publication state was changed. Strict remains **0/57** and published remains **false**.
