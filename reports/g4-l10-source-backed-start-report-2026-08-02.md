# Grade 4 Lesson 10 source-backed start report

**Date:** 2026-08-02  
**Scope:** read-only source/catalog inspection plus one standard draft workspace.  
**Acceptance state:** acceptance-neutral. This report does not claim a JavaScript implementation, source fidelity, audio correctness, original-runtime behavior, human or owner review, strict completion, or lesson publication.

## Result

The bounded next start item is **`course-g04-l10-vb-003`** — Grade 4, Lesson 10, activity order **7**, Important Words / Vocabulary, **“Unit of Measurement.”**

The canonical FLA and shipped SWF both exist, have catalog-confirmed identity, and no canonical workspace existed before this task. The standard project scaffold therefore created:

```text
migrations/course-g04-l10-vb-003/
```

The scaffolded workspace passed the portable draft validator. Its status remains `preserved`; the validator explicitly warns that draft mode does not resolve source paths or prove migration completion.

No Google Drive quarantine material was promoted or used. No file under `source-assets/`, `apps/web/`, or `packages/demos/` was changed.

## Lesson identity and active order

The canonical lesson XML is `HELP_COURSES/ELMGR4/L10/index.xml`, SHA-256 `652b236f1ad46077e75accc6fe7acb091cbd0bd24b8d99fa0b1f5ffeb1a379e9`. It identifies Grade 4 Lesson 10 as **Perimeter & Area** and has 46 active `<Page>` references. Its parser flag is `tolerantParsingApplied: true` because the preserved XML contains two bare ampersands; its source order remains usable and was not rewritten.

| Active order | Section | Canonical active SWF sequence |
| ---: | --- | --- |
| 1 | IR — Introduction | `IR/L10RW01.swf` |
| 2–5 | RW — Your World | `RW/L10RW02.swf` through `RW/L10RW05.swf` |
| 6–15 | VB — Important Words | `VB/L10VB02.swf` through `VB/L10VB11.swf` |
| 16–30 | IN — Learn It | `IN/L10IN02.swf` through `IN/L10IN16.swf` |
| 31–35 | TI — Try It | `TI/L10TI02.swf` through `TI/L10TI06.swf` |
| 36 | GS — Play It | `GS/L10GS02.swf` |
| 37–43 | TS — Practice Test | `TS/L10TS02.swf` through `TS/L10TS08.swf` |
| 44–46 | FQ — Final Quiz | `FQ/L10FQ01.swf` through `FQ/L10FQ03.swf` |

The commented-out introduction SWFs in several section bodies are not counted as active pages. The catalog also records them as source assets, which is why a broad L10 asset search returns more than 46 SWFs; they were not selected for this start item.

## Canonical source and audio coverage

| Coverage dimension | Observed state |
| --- | --- |
| Active XML pages with canonical shipped SWF | 46 / 46 |
| Active pages with same-path canonical FLA + SWF | 34 / 46 |
| Active SWF-only pages | 12 / 46 |
| L10 MP3 files in the canonical source tree | 157 |
| Non-FQ `SA/` files | 43; 42 have an exact active-page basename match |
| Cataloged L10 audio groups | 1: `course-g04-l10-fq-audio`, 114 files (54 English, 60 Spanish), all under `FQ/` |

The non-FQ audio files are source presence only. They are not per-cue runtime bindings, language-completeness proof, timing evidence, or listening acceptance. In particular, no catalog audio group yet binds the selected vocabulary page.

## Selected activity and immutable source identity

`course-g04-l10-vb-003` is the second active Vocabulary page (`VB/L10VB03.swf`) and the seventh active L10 page. It was selected because it is an ordinary Vocabulary page rather than a Final Quiz, Try It, Play It, or course-shell surface; the XML declares neither `RandomAudio="Yes"` nor `Navigation` for it; and among these ordinary FLA-paired activity candidates it has the smallest combined FLA+SWF byte size observed (864,932 bytes). This is a bounded planning heuristic, not a complexity or fidelity finding.

| Source | Canonical relative path | SHA-256 |
| --- | --- | --- |
| FLA | `HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla` | `1eccb733544de8eb0fa718cac6a1792e2e58145c737f6170e56268fc212003f7` |
| Shipped SWF | `HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf` | `96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d` |
| `SA/`-directory source-present MP3, cataloged as language `und`, matching-basename, unbound | `HELP_COURSES/ELMGR4/L10/SA/L10VB03.mp3` | `491873156323b693212856ce2d3bec9d0e43aac2851f547489ae9346931bff03` |

The catalog resolves the activity ID uniquely to asset ID `swf-96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d`; it is confirmed, referenced, non-variant, and not a lesson shell. The scaffold recorded the shipped SWF as CWS v6, native stage 800 × 600, 12 FPS, root frame count 10, and duration 833.333 ms. These are static header facts, not a complete runtime/timeline audit. The report date is the Asia/Shanghai local date; the workspace `created` field is an ISO UTC timestamp and can therefore show the preceding calendar date.

## JavaScript and workspace coverage

Before scaffolding, there was no `migrations/course-g04-l10-*` workspace. A repository search outside catalogs, preserved sources, reports, work products, and prior standalone package copies found no L10-specific renderer/module for `course-g04-l10-vb-003`, `L10VB03`, or `ELMGR4/L10`. Consequently, the new workspace contains only the standard migration template; it creates no renderer, public route, registry entry, capture output, or JavaScript claim.

The template initializes two root-domain coverage requirements (English and Spanish), each with frames 1–10 still missing. The initially written file hashes are:

| Workspace file | SHA-256 |
| --- | --- |
| `migration.json` | `52fee7b9f5387e4d072bfe6489b88f4479a2c6a0383c14b132010ec6d8e0fbc7` |
| `evidence/full-frame-coverage.json` | `c4f7a060587fd2f6ecd3f7f248b20ed353d10f09f3c0d9c24bc8ffe8a63296be` |

## Verification record

| Command | Result |
| --- | --- |
| `npm run doctor` | PASS — required project tools and listed forensic tools available |
| `npm run verify:workbench` | PASS |
| `npm run verify:sources` | PASS — 7,919 files, 2,779,928,841 bytes |
| `npm test` | FAIL before this workspace was created: one unrelated G4 L3 calibration test failed because `reports/g4-l3-runtime-capture-tool-readiness.json` has byte-length drift |
| `node --test scripts/analyze-g4-l3-runtime-capture-audio-calibration.test.mjs` | FAIL — 4 passed, 1 failed; confirms the same pre-existing report-byte drift |
| `npm run scaffold:migration -- course-g04-l10-vb-003 --fla …/L10VB03.fla --swf …/L10VB03.swf` | PASS — standard scaffold created the workspace |
| `node skills/flash-to-js/scripts/validate_migration.mjs migrations/course-g04-l10-vb-003 --allow-draft` | PASS with draft-mode non-completion warning |

The failing calibration test is not modified, refreshed, accepted, or attributed to L10 by this task.

## Unclosed gates and next authorized work

All substantive migration gates remain closed: FLA authoring inspection, full SWF tag/script/symbol/audio audit, source dependency and font inventory, original-runtime natural traces, bilingual/audio cue binding and listening, baseline captures, implementation, deterministic renderer/capture contract, full-frame comparison and RMSE review, product/accessibility QA, named human visual review, owner acceptance, strict validation, completion ledger admission, and atomic L10 release status.

The next migration task should audit the paired sources in a byte-identical working-copy process, complete the specification artifacts before renderer work, and preserve the unresolved non-FQ audio binding as a blocker rather than guessing it.
