# NewHelpProgram 2021 SQL Archive Catalog for HELP Math 2.0

Catalog date: 2026-07-25  
Source snapshot: 2021-02-03  
Source folder: `/Volumes/WestWorld/Extracted_NewHelpProgram_20210203`  
Catalog scope: filenames, structure, schema metadata, integrity evidence, and
aggregate-only findings. No names, emails, login IDs, passwords, addresses,
free-text notes, or individual student/teacher records are copied into this
repository.

Machine-readable companions:

- [Complete file catalog](newhelpprogram-20210203-files.csv): 1,081 files with
  size, type, database-table mapping, priority, sensitivity, existing integrity
  evidence, and recommended HELP Math 2.0 use.
- [Database table catalog](newhelpprogram-20210203-tables.csv): all 87 tables
  with row/column counts, domain, sensitivity, and recommended use.
- Rebuild command:
  `node scripts/build-newhelpprogram-catalog.mjs`

## Most useful information for HELP Math 2.0

- **The extraction is structurally complete and internally validated: 87/87
  tables, 743 columns, 27,674,245 rows, native BCP plus readable JSONL for every
  table, and zero table-export validation failures.** The source database was a
  SQL Server 2008 R2 database restored and checked in an isolated SQL Server
  2022 environment.
- **The strongest curriculum-recovery sources are `Courses`, `Lessons`,
  `MetaData`, `ssm_LessonsPages`, `ssm_QuizQuestions`, `LearningObjectives`,
  and the `ssm_*` standards/grades/skills/taxonomy tables.** They preserve
  course names, lesson order, section names, page titles, constructed-response
  flags, learning objectives, standards mappings, and legacy asset paths.
- **The snapshot contains 10 course records, 3,727 lesson records, 74 active
  lessons, 2,983 structured lesson-page records, and 1,883 structured lesson
  quiz-question records.** Of the 74 active lessons, 73 have structured page
  and quiz metadata; the Earth Science lesson “The Water Cycle” is the one
  active exception.
- **The database identifies 6,776 distinct normalized SWF references across
  legacy metadata, lesson pages, and lesson quizzes.** These are path
  references, not embedded SWF binaries. They are useful for reconciling
  `catalog/animations.json`, `catalog/lessons.json`, and
  `catalog/missing-references.json`, but they do not close a missing-source or
  Flash-fidelity gate.
- **The assessment layer preserves 42 active pre/post tests, 545 assessment
  questions, 1,883 lesson quiz-question definitions, and 411 learning
  objectives.** All 545 main assessment questions populate Spanish question
  text; 176 populate Spanish text for each answer option. Image fields in that
  main question table are unpopulated, so visual assets must be recovered from
  the file archive or other evidence.
- **The historical activity data can inform a modern learning-event and
  mastery model:** 8,027,300 time-in-task rows, 4,128,639 answered-question
  rows, 1,911,879 quiz attempts, 564,170 completed lessons, and 114,687
  completed tests. Use these only as de-identified aggregate research data,
  not as production HELP Math 2.0 accounts or current school records.
- **The schema preserves legacy business logic in 22 SQL module definitions:**
  10 views, 7 stored procedures, and 5 functions. The most relevant named
  objects include test assignment for classes/students, active-class/school
  views, standard-number formatting, and district-activity logic. Translate
  reviewed rules into modern application services; do not deploy the legacy
  database code unchanged.
- **Critical security boundary: the raw archive contains direct student,
  teacher, school, and district identifiers plus legacy credential fields.**
  The aggregate audit found 78 sensitive-named columns, none marked with SQL
  data masking, and populated password values that do not resemble modern
  password hashes. Treat the `.bak`, BCP, JSONL, account tables, notes, and
  security scripts as restricted private data. Do not commit, publish, upload,
  or import these records into HELP Math 2.0.

## Recommended source order

| Order | Files | HELP Math 2.0 value | Boundary |
|---:|---|---|---|
| 1 | `analysis/analysis_results.json` | **Best privacy-safe machine-readable overview of curriculum, assessment, activity, integrity, and security findings.** | Aggregate only; still verify calculations before product decisions. |
| 2 | `extracted_NewHelpProgram_20210203/01_catalog/tables.tsv`, `columns.tsv`, `exact_row_counts.tsv`, `foreign_keys.tsv`, `foreign_key_columns.tsv`, `dependencies.tsv`, `modules.tsv` | **Fast schema and relationship map without reading raw personal records.** | Schema may reveal legacy account or infrastructure names. |
| 3 | `extracted_NewHelpProgram_20210203/02_schema/NewHelpProgram_validated_without_login_mappings.dacpac`, `NewHelpProgram_schema.sql`, `all_22_raw_module_definitions.sql`, `SqlProject/` | **Authoritative design and business-logic evidence for a clean modern data model.** | Review security objects and obsolete SQL Server patterns; do not deploy directly. |
| 4 | Content/taxonomy JSONL files identified as `high` in the table catalog | **Recover course, lesson, page, objective, assessment, bilingual, and standards metadata.** | Import through a reviewed content-normalization pipeline, never directly into production. |
| 5 | Activity/outcome JSONL files identified as `restricted_high` | **Design event schemas, mastery metrics, teacher reports, and data-quality tests.** | De-identify and aggregate in an isolated environment; no raw historical user migration by default. |
| 6 | Native BCP data and the `.bak` | **Disaster recovery and provenance only.** | Highest-sensitivity material; keep private and immutable. |

## Folder catalog

| Folder or file | Files | Bytes | Purpose and usefulness |
|---|---:|---:|---|
| `NewHelpProgram_20210203.bak` | 1 | 22,018,633,216 | **Immutable original SQL Server recovery source.** Restricted full database; not application input. |
| `analysis/` | 7 | 240,690 | **Aggregate-only audit, reproducible notebook/script, and report source.** Two `.pyc` files are disposable generated artifacts. |
| `extracted_NewHelpProgram_20210203/00_backup_assessment/` | 8 | 25,089 | Backup header/file list, restore log, `VERIFYONLY`, DBCC result, runtime notes, summary, and source hash. **Use for provenance and restore health.** |
| `extracted_NewHelpProgram_20210203/01_catalog/` | 24 | 249,629 | Table, column, key, index, constraint, module, dependency, permission, storage, and row-count catalogs. **Use this before opening raw data.** |
| `extracted_NewHelpProgram_20210203/02_schema/` | 157 | 376,132 | Two DACPACs, schema SQL, 149-file SQL project, 22 raw module definitions, and diagnostics. **Use to recover the legacy model and business rules.** |
| `extracted_NewHelpProgram_20210203/03_data_native/` | 523 | 10,102,074,708 | 87 native BCP files, 87 format files, logs, completion markers, and empty error evidence. **Lossless recovery layer; restricted.** |
| `extracted_NewHelpProgram_20210203/04_data_jsonl_gzip/` | 348 | 1,903,044,977 | 87 compressed JSONL tables plus logs, markers, and error evidence. **Readable analysis/import layer; raw tables remain restricted.** |
| `extracted_NewHelpProgram_20210203/05_validation/` | 5 | 74,435 | Per-table export status, summary, and SHA-256 evidence. **Use to validate the extracted package before analysis.** |
| `extracted_NewHelpProgram_20210203/scripts/` | 5 | 20,278 | Repeatable SQL/shell catalog, count, BCP, JSONL, and validation procedures. **Useful extraction provenance; scripts contain no stored SQL password.** |
| `.DS_Store` and Python bytecode | 5 | — | Generated system files with no HELP Math 2.0 value. Exclude from future archival packages. |

The complete folder contains **1,081 files totaling 34,024,762,148 bytes**.
The current validation manifest has 418 nonblank SHA-256 entries; together
with the separately declared source `.bak` hash, 419 cataloged files have
existing hash evidence. This differs from the package README statement of 415
manifest entries, so the current manifest file, not the prose count, is used by
this catalog. On 2026-07-25, all 418 manifest entries passed
`shasum -a 256 -c`, and the current `.bak` independently matched its declared
SHA-256
`562471dc6f9577b1bcb3d614f8adbcf5c9c1a3bad7b569eb22ebe7eadaf921d7`.

## Database domains

| Domain | Tables | Rows | Recommended disposition |
|---|---:|---:|---|
| Behavior, sessions, and notes | 10 | 10,924,221 | **High analytical value, restricted raw data.** Use de-identified aggregates and schema patterns. |
| Legacy temp/import tables | 9 | 7,305,312 | Reconcile against authoritative definitions; exclude from direct migration by default. |
| Assessment outcomes and recommendations | 16 | 6,875,466 | **Definitions and diagnostic rules are high value; student outcomes are restricted.** |
| Assignments, activations, and configuration | 8 | 1,823,958 | Use relationships to design modern assignment/roster flows; do not import raw links by default. |
| Accounts, organizations, classes | 13 | 697,637 | Schema reference only; rebuild identity and authorization from modern requirements. |
| Course content and taxonomy | 28 | 47,618 | **Highest direct content-migration value.** This catalog intentionally treats the 2-row `Languages` table as curriculum configuration. |
| System/reference/other | 3 | 33 | Provenance or implementation reference only. |

## Data-quality and migration cautions

- **Snapshot date:** the data stops at the 2021-02-03 backup and cannot be
  treated as current enrollment, account, school, usage, or curriculum truth.
- **Relationship trust:** 31 of 65 foreign keys are marked not trusted. Verify
  join coverage and intended grain before using relationships for migration.
- **Observed integrity gaps:** the aggregate audit found 294 enrollments whose
  class was absent, 1,630 whose student was absent, and smaller orphan counts
  in question, login, and class references.
- **Date quality:** several large activity tables contain invalid historical
  date values. Preserve raw strings during staging, then normalize with an
  explicit reject/quarantine path.
- **Legacy identifiers:** duplicate normalized login IDs and placeholder dates
  exist. Do not make login IDs a global HELP Math 2.0 identity key.
- **Temporary tables dominate storage:** `PreTestsQuestionsTemp` and
  `PostTestsQuestionsTemp` contain millions of repeated, student-linked rows
  and most of the LOB footprint. Treat the 545-row
  `PreAndPostTestsQuestions` table as the primary assessment-definition
  candidate until reconciliation proves otherwise.
- **No binary-source substitution:** database SWF paths, URLs, question text,
  and metadata are valuable provenance but do not replace original FLA/SWF,
  runtime, audio, visual, or owner-acceptance evidence.

## Proposed HELP Math 2.0 use

1. Build a privacy-reviewed content crosswalk from `Courses`, active `Lessons`,
   `MetaData`, `ssm_LessonsPages`, `ssm_QuizQuestions`, and `ssm_*` taxonomy
   into the current source and lesson catalogs.
2. Recover bilingual assessment definitions and learning objectives into a
   versioned editorial content schema, keeping correct-answer data private from
   the student client.
3. Use the activity/outcome tables only to derive aggregate metric definitions,
   data-quality thresholds, and a modern event taxonomy; do not reuse legacy
   raw identities.
4. Redesign authentication, tenant isolation, consent/retention, roster
   integration, and authorization from current privacy requirements. Migrate no
   legacy password value.
5. Preserve the original `.bak`, native BCP, JSONL, schema, and validation
   evidence in restricted storage with a separate backup. Keep them outside
   web deployments and ordinary Git.
