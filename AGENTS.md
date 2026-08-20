# HELP MATH Flash-to-JavaScript Instructions

These instructions apply to the whole project. Treat the original FLA/SWF files as irreplaceable source evidence and this repository as a reusable migration workbench.

## Imported Session Memory

Six prior Codex sessions from the original internal-drive project were exported
on 2026-07-25. Before continuing inherited HELP Math work, read
`PROJECT_MEMORY.md` and
`documentation/session-memory-export-2026-07-25/INDEX.md`.

The import contains concise handoff memories plus sanitized user-visible
transcripts. Treat historical test, deployment, approval, path, and progress
claims as dated evidence: reverify current files and external state before
acting. Never expand a current-JavaScript approval into Flash fidelity, audio,
human visual, owner, strict-completion, or release acceptance.

## Owner Decision: Page-Only Flash Migration Scope — 2026-08-16

This decision supersedes every earlier planning rule that counted one legacy
Flash course shell per Lesson as a required migration, renderer, strict-
completion, or release member.

- HELP Math 2.0 already has a modern Lesson Page / My Lesson presentation
  surface. Its left-side course directory, lesson/page navigation, bottom
  playback controls, progress, support tools, and surrounding responsive UI are
  modern product code and remain part of the product.
- The center region of that modern Lesson Page hosts the JavaScript-based
  educational animation that replaces the corresponding HELP Math 1.0
  Flash-based lesson-page animation.
- The migration target is therefore the active lesson-page animation
  placements only. For the current G3-G5 catalog this is 1,751 active page
  occurrences across 29 Lessons: G3 = 546, G4 = 645, and G5 = 560.
- The 29 legacy course-shell SWFs remain preserved source/history evidence, but
  they are explicitly outside the implementation, Current-JS coverage,
  original-runtime/fidelity, audio, human/Owner acceptance, strict-completion,
  release-membership, and publication denominators. Do not scaffold, rebuild,
  capture, review, or count them merely to complete a Lesson.
- A Lesson is page-level Current-JS complete when every active page placement
  in the source-ordered Lesson sequence has a registered, runnable JavaScript
  renderer and the modern My Lesson host can present that sequence. A separate
  JavaScript recreation of the legacy Flash shell is not required.
- Do not remove the modern Lesson Page host just because an existing React
  component, CSS class, descriptor, or route contains the word `shell`.
  `shell` is overloaded in the current codebase: the retained modern product
  container is different from the excluded legacy Flash course-shell SWF.
- When a page animation historically called a shell-owned API, implement only
  the minimal source-evidenced adapter needed by that page inside the modern
  host. This does not bring the legacy shell back into migration scope.
- The verified working-tree planning snapshot on 2026-08-16 is 98/1,751
  registered Current-JS lesson pages, with 1,653 remaining. G4 L3 is 39/39 and
  G5 L4 is 54/54 at the page-level Current-JS gate. Strict completion remains
  separately fail-closed at 0.
- Existing descriptor, coverage, release, ledger, test, report, and package
  contracts that require `courseShellCount: 1`, add `pages.length + 1`, or
  report 1,780 members are legacy shell-inclusive contracts. Until they are
  deliberately refactored and reverified, report their output as superseded
  planning data rather than the current Owner-approved migration denominator.

The current G3-G5 Current-JS RC target is therefore **1,751/1,751 active
lesson-page animations registered and integrated into the modern My Lesson
experience**. Strict fidelity, audio acceptance, human/Owner acceptance,
strict completion, and publication remain separately reported gates.

## Historical Office Archive Memory

The historical office-document archive is a private legacy evidence source. It
is separate from both the canonical `source-assets/` collection and the HELP
Math 1.0 SQL archive. Its metadata catalog is intentionally kept outside Git
and web deployments.

The external source folder is:

```text
/Volumes/WestWorld/HELP MATH Related Files/Historical Office Documents of HELP MATH Program
```

Before using historical business claims or looking for legacy technical files,
read these private, read-only catalog entry points in order:

1. `private-archive/historical-office-catalog-2026-07-25/README.md` for scope,
   custody, and reconstruction boundaries.
2. `private-archive/historical-office-catalog-2026-07-25/CLAIM_EVIDENCE_LEDGER.md`
   before repeating any historical sales, reach, renewal, improvement, lesson,
   or instructional-hours claim.
3. `private-archive/historical-office-catalog-2026-07-25/technical-source-crosswalk.json`
   before importing an FLA, SWF, audio, XML, or AS file.
4. `private-archive/historical-office-catalog-2026-07-25/files.csv` only when
   path-level inventory or sensitivity review is required.

Current verified facts, dated 2026-07-25:

- The reconstructed pre-dedup snapshot contains 3,713 paths totaling
  3,615,658,010 bytes, with 54 exact duplicate groups and 110 extra duplicate
  paths. Its checksum-set SHA-256 is
  `c7cec93001b1b8b67677b75c9f423adeef13ca6b261ebe1d93e0c46d2af0ddbb`.
- Of those paths, 3,675 files still exist and were rehashed. The other 38 are
  record-only entries reconstructed from the prior verified deduplication
  manifest; their deleted content must never be described as still present.
- The technical-source list contains 1,455 paths: 142 FLA, 364 SWF, 933 audio,
  11 XML, and 5 AS. Exact-hash comparison found 826 matches in the current
  `source-assets` catalog, including 20 also present in migration workspaces;
  629 have no current exact source-assets match.
- The eight authority and eight sensitivity values are deterministic catalog
  classifications, not professional legal, privacy, financial, health, or
  records-management determinations. Preserve overlapping sensitivity tags and
  review the 309 low-confidence rows before consequential use.
- Historical claim status is constrained as follows: the internal sales
  workbook sums to USD 5,326,731 but is not an independent audit; `28 states`
  lacks a complete state roster; `95% renewal` conflicts with a historical
  `60-70%` figure; `70% improvement` is not established by the archived WWC
  report, which reports a +31 improvement index; `73 lessons` is a historical
  scope claim while the current source-backed lesson catalog has 29 entries;
  and 200/250/300/350 hours are incompatible versioned first-party estimates,
  not one verified runtime measure.

Relocation status, verified 2026-08-02:

- The external archive now resides under `HELP MATH Related Files` at the path
  above. Current executable catalog and provenance scripts use that path;
  dated receipts and historical reports retain the old path as immutable
  historical evidence.
- All 3,675 currently present files were rechecked after relocation. Exactly
  3,674 still match the 2026-07-25 catalog by path, size, and SHA-256. The sole
  drift is the archive-root `.DS_Store`: its size remains 30,724 bytes, while
  its SHA-256 changed from
  `70f713081cf39e4620c7c46729b79dbc6ecf980df7619b14da6b7cec43303b67`
  to `0c4b69dff70c04f3e329131905b6e1416658b2757a284f458e85c300abb5a792`.
- `npm run archive:historical:check` must continue to fail closed on this
  difference until a reviewed restore or a new dated catalog explicitly
  resolves it. Do not weaken the verifier or claim full byte identity.

### Historical Office Archive Privacy and Use Boundary

- Keep `private-archive/` excluded from Git, Vercel, application bundles,
  screenshots, prompts intended for sharing, and public reports. File paths and
  metadata can themselves contain PII or confidential business information.
- Treat claims as evidence-ledger findings, not approved marketing, investor,
  legal, or public statements. Recheck the underlying hash-bound source and
  resolve recorded conflicts before external use.
- Match technical assets by SHA-256, not filename. An exact match proves byte
  identity only; it does not prove runtime fidelity, migration acceptance, or
  release readiness.
- Do not modify the external archive while cataloging it. Run
  `npm run archive:historical:check` to verify the current read-only catalog;
  regenerate only through the reviewed generator and never overwrite the
  historical source directory.

## HELP Math 1.0 SQL Archive Memory

The restored HELP Math 1.0 SQL archive is a second legacy evidence source. It
is separate from the FLA/SWF source archive and must never be treated as a
substitute for original animation binaries or runtime evidence.

The private source folder is:

```text
/Volumes/WestWorld/HELP MATH Related Files/Extracted_NewHelpProgram_20210203
```

Before using SQL-derived information, read:

1. `catalog/NEWHELPPROGRAM_20210203.md` for the privacy-safe, human-readable
   catalog and current project conclusions.
2. `catalog/newhelpprogram-20210203-files.csv` for the complete 1,081-file
   inventory, file roles, sensitivity, and existing integrity evidence.
3. `catalog/newhelpprogram-20210203-tables.csv` for all 87 tables, their grain,
   priority, sensitivity, and recommended HELP Math 2.0 use.
4. The external `analysis/analysis_results.json` only when aggregate details
   beyond the repository catalog are required.

Current verified facts, dated 2026-07-25:

- The extraction contains 87/87 tables, 743 columns, and 27,674,245 rows. All
  87 tables have native BCP and readable compressed JSONL exports, with zero
  table-export validation failures.
- All 418 entries in the extraction SHA-256 manifest passed, and the current
  22,018,633,216-byte `.bak` matched SHA-256
  `562471dc6f9577b1bcb3d614f8adbcf5c9c1a3bad7b569eb22ebe7eadaf921d7`.
- The highest-value curriculum sources are `Courses`, `Lessons`, `MetaData`,
  `ssm_LessonsPages`, `ssm_QuizQuestions`, `LearningObjectives`, and the
  `ssm_*` standards, grades, skills, and taxonomy tables.
- The snapshot records 10 courses, 3,727 lesson rows, 74 active lessons, 2,983
  structured lesson pages, 1,883 lesson quiz-question definitions, 42 active
  pre/post tests, 545 assessment questions, and 411 learning objectives.
- The database identifies 6,776 distinct normalized SWF references. They are
  paths, not embedded SWF binaries, and cannot close missing-source, original
  runtime, audio, RMSE, human-review, owner-acceptance, strict-completion, or
  publication gates.
- Historical activity tables can inform a modern event, mastery, progress, and
  reporting model only through privacy-reviewed, de-identified aggregates.
  They are not current production truth and are not default migration inputs.

The SQL archive was relocated under `HELP MATH Related Files` before the
2026-08-02 continuation. Current executable catalog and crosswalk scripts use
the path above. Dated reports and authorization receipts may retain the former
path as historical evidence and must not be rewritten merely because the
archive moved.

### SQL Archive Privacy and Use Boundary

- Treat the `.bak`, BCP, JSONL, account/organization tables, free-text notes,
  activity rows, and legacy security scripts as restricted private data.
- Never copy names, emails, login IDs, password values, addresses, birthdays,
  notes, or individual student/teacher records into Git, prompts, reports,
  application fixtures, logs, screenshots, or public deployments.
- The archive has 78 sensitive-named columns, none marked with SQL data
  masking. Legacy credential values do not resemble modern password hashes.
  Never migrate, reuse, display, test, or attempt to validate a legacy password
  value; redesign authentication and authorization from current requirements.
- Prefer the repository catalog and aggregate analysis before opening raw table
  exports. If raw inspection is necessary, use the smallest relevant table and
  fields in an isolated environment, emit only aggregate or redacted findings,
  and record the reason.
- Treat the 2021-02-03 snapshot as historical. Recheck grain, dates, joins, and
  definitions before analysis: 31 of 65 foreign keys are marked not trusted,
  and known orphan references, duplicate normalized login IDs, placeholder
  dates, and invalid historical date values exist.
- Treat `PreAndPostTestsQuestions` as the primary assessment-definition
  candidate unless reconciliation proves otherwise. The much larger
  `PreTestsQuestionsTemp` and `PostTestsQuestionsTemp` tables are repeated,
  student-linked legacy staging data and are excluded from direct migration by
  default.
- Use SQL content paths to reconcile the current lesson/source catalogs, but
  record conflicts and missing binaries rather than inventing or promoting
  sources. Current FLA/SWF evidence remains authoritative for animation
  behavior and fidelity.
- Preserve the external archive byte-for-byte with a separate restricted
  backup. Keep it outside ordinary Git and all web deployments.

## Google Drive Technical Source Intake Memory

The owner-authorized technical-source intake downloaded on 2026-08-02 is held
outside this repository at:

```text
/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-02-HELP-ELM-FINAL-Dec21-2015
```

Read its `README.md` and `manifests/intake-receipt.json` before using any of its
files. It is a private, acceptance-neutral quarantine snapshot; it is not a
canonical source promotion and must remain outside Git and web deployments.
The finalized snapshot contains 14,326 files in 448 directories and is frozen
without user write permission. Its final README SHA-256 is
`fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e`; its
intake-receipt SHA-256 is
`3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4`.

Current hash-bound intake facts:

- `HELP_COURSES/ELMGR3` was downloaded as a 1,139,666,160-byte ZIP with
  SHA-256 `82b9e290534b9882bc590a1f021e302fe7d7aa82ce0d4f07a56d520e3eb75234`.
  Its verified extraction contains 3,563 files and has checksum-set SHA-256
  `ca8baa8f4c8f78c6f95b9ccc3453bfea1d546a78b7273d195b48c9e09a832bfe`.
  The intake plan selects 3,562 technical files, excludes one `.sfap0` editor
  sidecar, and finds zero same-path byte conflicts. It classifies 1,449 rows as
  new-source candidates, 122 as historical-custody holds, 135 as
  canonical-other-path placement holds, and 1,856 as exact canonical skips.
- Grade 3 has eight cataloged lessons, 546 active page occurrences, and eight
  lesson shells. Current canonical source coverage is 298/546 pages plus 8/8
  shells, or 306/554 members. The quarantine recovers all 248 missing page
  SWFs by exact path; 194 have a same-path FLA and 54 are SWF-only. Only after
  reviewed promotion and a catalog rebuild can potential coverage become
  554/554.
- `HELP_COURSES/ELMGR4` was downloaded as a 1,204,604,856-byte ZIP with
  SHA-256 `835149d34d8abe34747295324ab5cd74f3cf6c59f90be75754e32ecaf0e78ee9`.
  Its verified extraction contains 5,209 files: 773 SWF, 623 FLA, 3,787 MP3,
  12 AS, 12 XML, and 2 JPG. All 2,755 paths already in the canonical Grade 4
  tree match exactly; there are zero same-path byte conflicts. The generated
  intake plan classifies 2,092 rows as new-source candidates, 235 as
  historical-custody holds, and 127 as canonical-other-path placement holds.
- The Grade 4 quarantine contains all 202 SWFs referenced by the active course
  XML but missing from the pre-transaction canonical catalog. Of these, 163
  have a same-path FLA and 39 are SWF-only. Grade 4 has 645 active page
  occurrences and 12 lesson shells. Pre-transaction canonical source coverage
  was 443/645 pages plus 12/12 shells, or 455/657 members. The reviewed
  active-source promotion below raised current canonical source coverage to
  657/657 without changing renderer or acceptance coverage.
- `HELP_COURSES/ELMGR5` was downloaded as a 1,097,547,166-byte ZIP with
  SHA-256 `3bdd32a5ed6f25ffdefdbf56417a3efe03fa55c414ea8a03dabc473bdd109ecb`.
  Its verified extraction contains 3,933 files: 659 SWF, 543 FLA, 2,711 MP3,
  9 AS, 9 XML, and 2 JPG, with checksum-set SHA-256
  `4595979c909440a083f614e53180d44d527095371220838044de028cac538238`.
  All 2,187 canonical same-path files match exactly and no same-path byte
  conflict was found. The plan classifies 1,589 rows as new-source candidates,
  136 as historical-custody holds, and 21 as placement holds.
- Grade 5 has nine cataloged lessons, 560 active page occurrences, and nine
  lesson shells. Current canonical source coverage is 418/560 page occurrences
  plus 9/9 shells, or 427/569 members. The quarantine recovers all 141 unique
  missing SWFs, covering all 142 missing page occurrences; 112 have a
  same-path FLA and 29 are SWF-only. Only after reviewed promotion and catalog
  rebuild can potential coverage become 569/569.
- `HELP_KEYTERMS/KT/ELEMENTARY/DIG` was downloaded as a 92,213,676-byte ZIP
  with SHA-256
  `e367ea90c904894080c4c8e11f9eaaaebf615e14b655991b68820977ecbd6428`.
  Its verified extraction contains 797 SWF and 797 FLA. Of 317 currently
  missing Key Term SWF references, 316 have one unique case-insensitive cloud
  match; those filename-case decisions require review. `Polynomial.swf`
  remains missing although `polynomial.fla` exists, so potential coverage is
  759/760 rather than 760/760.
- The signed-in Drive tree also showed no additional missing auxiliary path:
  `HELP_AS_FILES` has the same four named AS files as canonical;
  `HELP_FORMULAS` corresponds to a locally catalog-consistent 50/50 FLA-SWF
  and 46/46 EAD-SAD MP3 stem inventory; non-DIG Key Terms show exactly the
  three canonical EAD MP3 names, two canonical XML names, and an empty SAD
  folder; the course root shows the same four `indexELM*.swf` names already in
  canonical custody. These auxiliary cloud bytes were not re-downloaded, so
  this is a path/name inventory plus local hash audit, not a cloud-byte hash
  attestation.
- A Drive folder ZIP provides a real container folder ID but not stable
  per-entry Drive IDs. Never invent synthetic entry IDs. Preserve the folder
  ID, ZIP hash, manifest path, file hash, and any case or variant decision.
- Source presence or byte identity does not prove JavaScript implementation,
  original-runtime behavior, audio correctness, visual fidelity, human or
  owner approval, strict completion, or publication readiness. Promotion into
  `source-assets/` requires a reviewed, atomic intake from byte-identical
  working copies and updated catalogs/ledgers.

### Grade 4 Reviewed Active-Source Promotion — 2026-08-02

- Transaction `20260802T040219914Z-1635d216a5c2` atomically promoted the exact
  reviewed active dependency closure, not all 2,092 generic candidate rows. It
  copied 202 active-page SWFs, 143 same-path FLAs, and 883 source-bound MP3s:
  1,228 files and 434,656,573 bytes. It retained 20 same-path FLAs, 854 MP3s,
  and nine lesson XML files as exact existing bindings; 1,022 generic
  candidate rows remain outside the transaction.
- The immutable plan SHA-256 is
  `61fbb021fbab57c427e1c0459c30cf94a88b449d0080c125d616213687833a87`.
  The immutable applied receipt is
  `catalog/source-promotions/g4-active-source-promotion-2026-08-02-applied.json`,
  SHA-256
  `df23e474a6a8ab632b5e7ed6928a485427ed8d1873fb846c2f79d06dfd0c0f72`.
- The rebuilt frozen canonical tree contains 9,147 files totaling
  3,214,585,414 bytes. Its source-manifest SHA-256 is
  `f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318`;
  its catalog checksum-set SHA-256 is
  `30dfa12b7cd76e7200fb89115155e7d32af1356247c07e3a4f79227e93f34875`.
  Grade 4 canonical source coverage is now 645/645 active pages plus 12/12
  shells, or 657/657 source members.
- Sixteen exact source-derived MP3 paths remain absent. Dependency closure is
  therefore explicitly false, and the transaction does not authorize audio
  fidelity, runtime fidelity, JavaScript completion, human or owner
  acceptance, strict completion, release, or publication.
- The verified pre-promotion source and catalog roots remain retained under
  transaction-specific recovery paths. Do not delete them until a separate,
  owner-authorized retention decision; the promotion executor never removes
  recovery evidence.

### Grade 4 Whole-Course Generation Snapshot — 2026-08-02 (Superseded Scope)

- This dated snapshot originally counted 645 active pages plus 12 legacy
  course shells as 657 required renderer members. The 2026-08-16 Owner decision
  supersedes that denominator. The current Grade 4 migration scope is 645
  active lesson pages only.
- At the page-only Current-JavaScript gate, the dated/current registry coverage
  is 41/645 pages with 604 pages remaining: L1 = 1 page, L3 = 39 pages, and L9
  = 1 page. Existing shell renderers are excluded from coverage. Only L3 is
  page-renderer-complete at 39/39.
- All 12 Grade 4 Lessons retain canonical source custody for their active page
  SWFs. Historical shell custody remains catalog evidence only and does not
  expand the page-only renderer or acceptance scope.
- Use `apps/web/lib/g4-course-catalog-coverage.server.ts` as the dated,
  fail-closed planning entry and recalculate after catalog or registry changes.
  Its descriptors do not automatically register a route or authorize Flash
  fidelity, audio acceptance, human/owner acceptance, strict completion, or
  publication.
- Grade 4 Lesson 10 has been started with the standard source-bound draft
  workspace `migrations/course-g04-l10-vb-003`. It is a preserved-source draft
  only: no renderer, baseline, audio decision, visual comparison, strict
  completion, whole-lesson route, or release claim exists yet.

### Google Drive Visible-Scope Successor and Google-native Export — 2026-08-03 to 2026-08-04

- The owner-authorized visible-scope continuation uses these two local roots as
  its fixed deduplication boundary:

  ```text
  /Volumes/WestWorld/HELP MATH Related Files
  /Volumes/WestWorld/HELP MATH 2.0
  ```

  Before persisting any ordinary Drive file, compare its complete SHA-256
  against both roots and the successor quarantine. Skip an exact local or
  already-persisted Drive byte sequence; never overwrite an existing local
  file. Record symbolic links without following them, record special files
  only in the local baseline, reject any Drive batch containing a special file
  before reading content, and keep owner-directed SQL ZIP handling outside the
  ordinary-file path.
- The v8 successor quarantine is held outside this repository at:

  ```text
  /Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-03-BOULDER-LEARNING-HELP-MATH-1-HISTORICAL-SUCCESSOR-V8
  ```

  Its final main-scope receipt installed 261 unique objects totaling
  5,421,560,163 bytes; the separately bounded nested-shortcut target installed
  six unique objects totaling 455,088,033 bytes. The final v8 total is therefore
  267 unique objects and 5,876,648,196 bytes. New Drive byte sequences were
  persisted at most once through content-addressed, atomic no-replace writes,
  using only complete SHA-256 for deduplication. The main-scope final A/B
  inventories each contained 25,559 items with zero item differences; the
  nested-scope A/B inventories each contained nine items with zero differences.
  The earlier 156-object / 99,464,626-byte figure was an intermediate candidate
  count and must not be repeated as the final download result.
- The hash-bound local baseline covers 692,492 regular files totaling
  128,846,973,982 bytes across the two local roots, plus 509 recorded-but-not-
  followed symlinks and zero special files. Its two complete snapshots agreed,
  and every regular file received a full SHA-256 during baseline construction.
  The post-final-scopes current check re-enumerated the full tree and matched
  the hash-bound frozen stable-stat snapshot with zero mismatches; it did not
  rehash every regular file during that current check. This is a bounded dated
  check; later filesystem changes still require a fresh current check. The SQL
  ZIP remained under its owner-directed extracted-content disposition; v8 does
  not prove possession or exact SHA-256 identity of the original ZIP container.
- The V7/V8 combined custody closure is held at:

  ```text
  /Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-04-BOULDER-LEARNING-V7-V8-COMBINED-FREEZE-CLOSURE
  ```

  Its applied receipt is `combined-freeze-applied-receipt-v1.json`, SHA-256
  `fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751`.
  The closure reconciles 5,793 v7 objects with all 5,793 represented in the v8
  full scope, retains 267 v8 objects, records zero v7/v8 digest overlap, and
  binds a 6,060-object SHA-256 union. The frozen source trees contain 12,323
  files in 868 directories totaling 25,367,519,832 bytes before closure
  artifacts, with zero writable entries, missing files, unexpected files,
  staging residues, or directory-path-set drift.
- The combined closure outcome is
  `frozen-read-only-with-unresolved-independent-review`: the independent-review
  receipt is still absent. Do not call V7 independently finalized, and do not
  write into either frozen tree. Any future Drive intake requires a new
  successor root and a new receipt; never refresh or replace the dated closure.
  The v8 successor root is filesystem-read-only at mode `0500`. Export V1, V6,
  and their closure use fixed receipts, restricted permissions, and no-overwrite
  rules; do not broaden that into a claim that all of those later roots are
  filesystem-read-only freezes.
- The 45 Google-native pointers that v8 deliberately did not persist as
  ordinary files were exported separately to the private Export V1 quarantine:

  ```text
  /Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-04-BOULDER-LEARNING-HELP-MATH-GOOGLE-NATIVE-EXPORT-V1
  ```

  Read `manifests/google-native-export-receipt-v1.json` before using an export.
  The receipt is 150,078 bytes with SHA-256
  `d61ccf40084b776d4a45f698d44971584e02917d7845f0847ec3676cc3037915`.
  The receipt binds 45 pointers to 90 successful exports: 42 DOCX, 45 PDF, and
  three XLSX, totaling 28,886,438 logical bytes, with zero failed exports.
  Export publication was content-addressed with `overwriteExisting: false`.
  These are transformed exports, not original Google-native bytes.
- Export V1 does not retain the original `.gdoc` or `.gsheet` descriptor bytes
  inside the Export V1 tree. The later V6 audit rehashed all 90 exported artifacts
  but verified the 45 pointer identities through the fixed receipt's descriptor
  SHA-256/byte metadata and hash-set; it did not re-read or re-hash the original
  pointer bytes. Never expand that receipt-bound verification into a claim that
  the current audit read the live Google-native objects or their original
  descriptor bytes.
- The current privacy-safe technical triage is V6, held outside Git and
  deployments at:

  ```text
  /Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-04-BOULDER-LEARNING-HELP-MATH-GOOGLE-NATIVE-TECHNICAL-RELEVANCE-CATALOG-V6
  ```

  Its builder receipt SHA-256 is
  `75dfe53394ba8bca1fd127c7f6fee1ad1b8c075a6ac2118be725db730106f99d`.
  It classifies 45 anonymous documents across seven categories, or 315 cells:
  SWF has seven confirmed; Grade 4 has one confirmed and one review; historical
  technical notes have six confirmed and ten review; course structure has 21
  review; FLA, XML, and MP3 have zero confirmed or review signals. Twenty-five
  documents require at least one manual review and four have a current
  cross-format disagreement. `review` is not a confirmed match, and `no` means
  only that no signal was found within the extractable-text/check boundary.
- The separate V6 final-closure receipt has SHA-256
  `562ca927d8015733f136c975535e41993370003dd5cb8f97f3b8f77c7230fdd1`
  and is held in the sibling
  `2026-08-04-BOULDER-LEARNING-HELP-MATH-GOOGLE-NATIVE-TECHNICAL-RELEVANCE-CATALOG-V6-FINAL-CLOSURE`
  directory. The receipt is 5,668 bytes and records `FINAL_GO` with three
  independent audits at `P0/P1/P2 = 0/0/0`.
  The shareable catalog contains anonymous HMAC-derived IDs only. Raw titles,
  source paths, Drive/account/person identifiers, text, snippets, and the HMAC
  key stay out of the shareable surface; the source crosswalk remains separate,
  private, restricted, and outside Git and deployments. V1 through V5 remain
  preserved as superseded evidence and must not be overwritten.
- Every v8, combined-freeze, Export V1, and V6 artifact above is private
  quarantine or technical-triage evidence only. None authorizes canonical
  source promotion, source completeness, JavaScript implementation, original-
  runtime or visual fidelity, audio correctness or acceptance, human visual
  review, owner acceptance, strict completion, whole-course integration,
  release, or publication.

## Product, Partnership, and Mission Memory

Treat this section as the project owner's long-term strategic direction. Preserve
the distinction between current product state, planned features, stakeholder
statements, and independently verified public facts.

- **HELP Math 1.0** is an online mathematics learning platform whose defining
  product feature is its library of Flash-based educational animations.
- **HELP Math 2.0** is the planned next-generation online mathematics learning
  platform. Its four new feature pillars are:
  1. JavaScript-based educational animations converted from HELP Math 1.0's
     Flash-based animations, subject to the source-faithful migration and
     acceptance gates in this file.
  2. **Nova Tutor**, an AI agent designed by Dr. Peter Hu to respond to students'
     mathematics-learning needs. The HELP Math 2.0 concept is informed by the
     Nova Tutor experience on [MAIS](https://www.mais.ac/).
  3. An **Adaptive Learning Algorithm** combining Bayesian Knowledge Tracing
     (BKT), large language models (LLMs), and a teacher-controlled adaptive
     learning path, also informed by MAIS.
  4. **Knowledge Galaxy**, also called the knowledge map, a visual knowledge and
     learning-path experience informed by MAIS.
- **MAIS** ([www.mais.ac](https://www.mais.ac/)) was created by Dr. Peter Hu.
  Its site describes it as a Mathematics Adaptive Interactive System, presents
  Nova Tutor as an interactive tutor, and identifies Dr. Peter HU Dongpin as
  its developer.
- Dr. Peter Hu is helping Boulder Learning modernize HELP Math 1.0 into HELP
  Math 2.0. Per the project owner, John Ramo serves as Chairman and CEO of
  Boulder Learning. A 2021 Boulder Learning press release identifies him as
  CEO; reverify both the current CEO status and the Chairman title before using
  either title in external publication.
- **Boulder Learning** ([www.boulderlearning.com](https://www.boulderlearning.com/))
  and **PedaNova** ([www.pedanova.tech](https://www.pedanova.tech/)) are working
  together on two adaptive-learning platforms: HELP Math 2.0
  ([www.helpmath.ai](https://www.helpmath.ai/)) and MAIS. This collaboration and
  each product's release scope, ownership, and readiness must still be verified
  for any public, legal, investor, or launch claim.
- The collaboration's strategic purpose is to help address the U.S. K-12
  mathematics education crisis through personalized and adaptive learning,
  with falling mathematics performance, unequal outcomes, and absenteeism as
  important parts of the public context.
- The companies' long-term corporate ambition is to become listed on the New
  York Stock Exchange. Treat this strictly as an aspiration, never as a current
  listing, guaranteed outcome, investment claim, or release milestone.
- The shared mission is to **accelerate the world's transition to personalized
  learning and teaching.**

### Public-Context and Evidence Boundary

- The 2024 NAEP grade 12 mathematics results provide important, dated context
  for the U.S. K-12 mathematics education crisis: 22% of twelfth-graders
  performed at or above NAEP Proficient, so 78% performed below that benchmark.
  The average score was 3 points lower than both 2019 and 2005, the start of the
  current grade 12 trendline. Lower-performing students declined more than
  higher-performing students, and student absenteeism was higher than in 2019.
  See the official [2024 Grade 12 Mathematics Results](https://www.nationsreportcard.gov/reports/mathematics/2024/g12/)
  and [National Trends](https://www.nationsreportcard.gov/reports/mathematics/2024/g12/national-trends/).
- Do not paraphrase the NAEP result as ordinary grade-level proficiency without
  qualification: NAEP explicitly states that `NAEP Proficient` is not the same
  as grade-level proficiency under state or district standards.
- Rising absenteeism was associated with part of the 2019-2022 NAEP score
  declines, but it should not be presented as the sole proven cause of the 2024
  grade 12 result. See the official [NAEP absenteeism analysis](https://nces.ed.gov/nationsreportcard/blog/attendance_and_naep_2022_score_declines.aspx).
- Product capabilities, partnership roles, company titles, and the NYSE
  ambition above are durable project memory supplied by the project owner.
  Reverify them against current first-party or legal sources before external
  publication because sites, roles, plans, and product status can change.

## Start Here

Before changing an animation:

1. Read `README.md`.
2. Read `skills/flash-to-js/SKILL.md` and follow it for every FLA/SWF migration.
3. Read `docs/TOOLING.md`, then run `npm ci`, `npx playwright install chromium`, and `npm run doctor` on a new computer.
4. Run `npm run verify:workbench` and `npm test` before editing.
5. Create a migration workspace with `npm run scaffold:migration -- <animation-id> --fla <path> --swf <path>`.

Do not claim fidelity, parity, or completion until the migration checklist and evidence prove it.

## Project Map

- `app/`: Next.js routes, including JavaScript rebuilds and Ruffle reference routes.
- `components/`: React/SVG animation renderers and extracted font paths.
- `lib/`: pure frame/timeline state and unit tests.
- `public/flash/`: SWFs used only for Ruffle reference playback.
- `public/flash-assets/`: extracted assets used by modern implementations.
- `source-assets/`: owner-provided FLA/SWF files, PDFs, and screenshots. Preserve them byte-for-byte.
- `migrations/`: one audit/evidence workspace per future animation.
- `templates/flash-migration/`: canonical new-animation work package.
- `skills/flash-to-js/`: reusable Codex migration procedure.
- `.agents/skills/flash-to-js/`: project-discovery shim pointing to the canonical skill above.
- `output/playwright/`: durable browser screenshots and visual-difference evidence.
- `outputs/`: standalone deliverables and modernization documents.
- `documentation/`: exported user-visible task history.
- `catalog/`: deterministic full-archive source, placement, taxonomy, duplicate,
  missing-reference, audio, lesson, and batch manifests, plus the privacy-safe
  HELP Math 1.0 SQL archive catalogs.
- `apps/web/`: the product Next.js library, course, player, and internal-status
  routes. Only strict `complete` migrations may appear in the public library.
- `packages/demos/`: shared animation runtime contracts and dynamic module
  registry used by the product application.

## Evidence Priority

When sources disagree, use this order and record the conflict:

1. Original FLA library, timeline, and scripts.
2. Original SWF runtime metadata, tags, bytecode, and embedded assets.
3. Captured behavior from an authorized original runtime or Adobe Animate test movie.
4. Ruffle playback, with the exact Ruffle version recorded.
5. Screenshots, PDFs, notes, and stakeholder recollection.

Ruffle is a forensic reference and compatibility fallback. It is not the default production implementation and is not proof that an HTML5 rewrite matches the original.

## Preserve The Legacy Sources

- Never edit, optimize, recompress, or overwrite a file under `source-assets/`.
- Copy new owner-provided sources into `source-assets/flash/` and record SHA-256 hashes in the migration manifest.
- Keep FLA and SWF together when both exist. Use FLA for authoring structure and SWF for shipped runtime behavior.
- Record missing fonts, external files, URLs, FlashVars, localization flags, audio, video, and network calls before implementation.
- Do not expose or execute unknown network endpoints from legacy ActionScript. Recreate required behavior through reviewed application APIs.

## Required Migration Sequence

Complete these gates in order:

1. **Intake:** scaffold `migrations/<animation-id>/`, preserve sources, and hash them.
2. **Audit:** determine stage size, frame rate, frame count, duration, ActionScript version, symbols, fonts, assets, scripts, masks, morphs, filters, audio, and external dependencies.
3. **Baseline:** capture frame 1, every visual or interaction transition, all formula/text states, and the terminal/replay state at the native stage size.
4. **Specification:** fill `migration.json`, `asset-inventory.csv`, `keyframes.csv`, and `MIGRATION_BRIEF.md` before writing the renderer.
5. **Implementation:** isolate timing in a pure JavaScript module and rendering in a React component. Keep extracted assets editable where practical.
6. **Behavior tests:** test metadata, every key beat, language variants, terminal state, and Replay/reset behavior.
7. **Visual validation:** capture deterministic implementation frames, compare them against the baseline, inspect diff images, and record normalized RMSE.
8. **Product validation:** check desktop and mobile layout, keyboard behavior, reduced motion, text overflow, console errors, and asset loading.
9. **Packaging:** provide a Next.js route and, when requested, a self-contained HTML + JavaScript viewing package.
10. **Handoff:** complete `ACCEPTANCE_CHECKLIST.md`, run all gates, and record known exceptions without hiding them.

Do not skip directly from a screenshot to implementation when an FLA or SWF is available.

## Rendering Decisions

- Prefer React + SVG for educational diagrams, labels, formulas, simple tweens, and objects that benefit from crisp responsive rendering and DOM semantics.
- Use Canvas for dense raster animation, particle-heavy scenes, or many rapidly changing sprites. Use a proven engine such as PixiJS or CreateJS when its runtime model materially reduces risk.
- Use CSS only for layout and small presentation transitions, not as the source of truth for a Flash timeline.
- Use video only for non-interactive background material and only with explicit approval. Never replace required interaction with a video.
- Preserve the native Flash coordinate system with a fixed SVG `viewBox`, or with a Canvas backing store equal to the authored stage multiplied by an integer device scale, and a responsive aspect-ratio wrapper. All drawing stays in authored stage units; the scale is applied once, ahead of the root transform. See *Integer-Scaled Canvas Backing Store* below.
- Keep user-facing text inside the original object bounds at every supported viewport.

### Integer-Scaled Canvas Backing Store — 2026-08-08

Owner-accepted amendment to the coordinate-system clause above. Before this date
the clause required *fixed* Canvas backing dimensions, which is why
`scripts/build-safe-ffdec-canvas-adapter.mjs` emits a hard
`targetCanvas must be exactly <w>x<h>` guard. That guard pinned the rendered
plane to one device pixel per authored pixel, so authored art was drawn at half
native resolution on a 2x panel and could not be widened at all.

What the amendment permits:

- A backing store of `stage.width * k` by `stage.height * k` for an integer `k`
  within a range the adapter declares. Non-integer and out-of-range values are
  still rejected by the guard, with an error naming what was expected.
- Exactly one `ctx.setTransform(k, 0, 0, k, 0, 0)` applied before the authored
  root transform. Every subsequent drawing call remains in 800 x 600 authored
  units. The authored coordinate system is preserved, not replaced.
- Scaling of pixel-denominated values inside the generated `Filters` block —
  blur radii in particular — so filtered output matches the unscaled result.

Required condition, not optional:

- `k = 1` output must be byte-identical to the pre-amendment baseline for every
  page. This is the gate that proves the amendment changed resolution and
  nothing else. A single differing page blocks the change.
- `k > 1` output is measured against that baseline under the *Fidelity Standard*
  thresholds below.

What this amendment does not authorize:

- No change to the authored `stage`, `fps`, `frameCount`, or `durationMs`
  constants, and no change to the `data-flash-*` identity a stage reports.
- Embedded bitmaps inside a page renderer do not gain resolution from `k`.
  Affected pages are enumerated with their bitmap counts and their softness is
  never described as improved by scaling.
- No Flash fidelity, audio, human visual, original-runtime, owner,
  strict-completion, or release acceptance is expanded by this amendment. It is
  a rendering-resolution decision only.

## Timeline Contract

- Store native `stage`, `fps`, `frameCount`, and `durationMs` as explicit constants.
- `runtime.frameCount` is always the SWF root timeline. Declare longer nested
  MovieClip timelines as separate frame domains with their placement/entry
  state; never relabel a child timeline as the root movie.
- Treat Flash frames as one-indexed.
- Derive visible state from elapsed time or an explicit frame. Avoid chained timeout choreography.
- Put all keyframe windows, transforms, alpha values, counters, labels, and language choices in pure testable functions.
- Add a deterministic capture mode that binds `frameDomain`, `requirementId`,
  `trace`, `entryStateSha256`, `frame`, `scenario`, `lang`, and `seed`, and make
  the stage report matching `data-flash-*` identity attributes.
- Ensure Replay resets the complete playhead/state vector, not only one frame counter.

## Fidelity Standard

A migration is acceptable only when:

- Native stage dimensions, frame rate, frame count, duration, and background are recorded and reproduced.
- Each required beat occurs on the specified frame; browser capture may differ by at most one frame only when the reason is documented.
- Text, numbers, formulas, language variants, and layering match the evidence.
- No label, control, or artwork clips or overflows at native, desktop, and mobile sizes.
- Designated static keyframes meet normalized RMSE `<= 0.05`; transition frames target `<= 0.08`. A higher value requires visual inspection, a written explanation, and owner acceptance.
- Where a Canvas backing store is integer-scaled, `k = 1` output is byte-identical to the pre-scaling baseline, and `k > 1` output meets the thresholds above against that same baseline. Resolution-bound embedded bitmaps are listed as known exceptions rather than smoothed over.
- Replay, keyboard activation, reduced-motion handling, and console/network checks pass.
- The migration validator passes in strict mode and all checklist boxes are complete.

Read `skills/flash-to-js/references/fidelity-validation.md` for the capture protocol. Numeric thresholds support review; they do not replace human visual inspection.

## Commands

```bash
npm run doctor
npm run verify:workbench
npm run verify:sources
npm run catalog:build
npm run ledger:check
npm test
npm run build
npm run scaffold:pilots
npm run sync:migrations
npm run scaffold:batch -- --batch batch-001 --dry-run
npm run scaffold:migration -- Conversion_1_5 --fla source-assets/flash/Conversion_1_5.fla --swf source-assets/flash/Conversion_1_5.swf
node skills/flash-to-js/scripts/validate_migration.mjs migrations/Conversion_1_5 --allow-draft
node skills/flash-to-js/scripts/validate_migration.mjs migrations/Conversion_1_5
```

Use `npm run capture:keyframes -- --help` and `npm run compare:frames -- --help` for reproducible visual evidence.

## Completion Report

Report the exact files changed, animation ID, source hashes, stage/fps/frame count, implementation route, standalone package path, test/build results, captured keyframes, RMSE results, accessibility checks, and every unresolved exception. If a required source or tool is unavailable, state that limitation and lower the fidelity claim.
