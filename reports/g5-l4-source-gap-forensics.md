# lesson-g05-l04-number-lines source-gap forensics

> This report reconciles preserved static sources. It cannot establish runtime reachability, recover missing content, change release scope, or grant implementation or acceptance authority.

## Page-set reconciliation

- Active XML pages: **54**; frozen release order matches exactly.
- `MainScript_New.as` `LessonDetails` pages: **59**.
- Extra in `LessonDetails`: **5**; missing from `LessonDetails`: **0**.
- Commented legacy XML pages: **6**.

Extras are static source differences, not proof of student reachability:

- `VB/L4VB01.swf`
- `IN/L4IN01.swf`
- `TI/L4TI01.swf`
- `GS/L4GS01.swf`
- `TS/L4TS01.swf`

| Commented XML path | In LessonDetails | Path-qualified AS reference |
|---|---|---|
| `RW/L4RW01.swf` | no | yes |
| `VB/L4VB01.swf` | yes | yes |
| `IN/L4IN01.swf` | yes | yes |
| `TI/L4TI01.swf` | yes | yes |
| `GS/L4GS01.swf` | yes | yes |
| `TS/L4TS01.swf` | yes | yes |

Use authorized original-shell natural navigation to determine student reachability. Any scope change requires a reviewed new release-manifest version; never silently mutate this release.

## Missing keyterm XML

| Language | Declared path | Physical | Exact catalog matches | Basename matches |
|---|---|---|---:|---:|
| english | `HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml` | missing | 0 | 0 |
| spanish | `HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml` | missing | 0 | 0 |

MainScript glossary signal lines: 422, 423, 424, 565, 566, 567; shell FFDec keyterms signal lines: 490, 491. These are dependency signals only.

## Blockers

- Authorized original-shell natural navigation has not established whether legacy introduction pages are student-reachable.
- L4KTE01.xml and L4KTS01.xml are absent from the current source catalog and physical preserved source root; their content must not be invented.
- Static ActionScript and FFDec symbol references cannot replace original-runtime behavior, network/file-load observation, bilingual review, or Owner disposition.

No release member, source, migration acceptance field, protected ledger, route, or publication state was changed. Strict remains **0/55** and published remains **false**.
