# G6–G8 shared Flash-to-JavaScript implementation runbook

This runbook is the executable companion to the `G6-G8-shared-v1` plan. It
describes the local engineering surface only. It does not promote the private
AWS recovery view to public source, and it does not grant Flash fidelity,
audio, human review, Owner acceptance, strict completion, release, or
publication authority.

## Scope and source identity

The source view is the private, read-only tree:

```text
/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware
```

The canonical source profile selects only:

```text
G6-G8-shared/<module>/L<lesson>/index.xml
```

with `NMS002`, `GEO001`, and `ALG001` lessons `L1..L12`, and `DAT001` lessons
`L1..L8`. XML comments are removed only for the active projection; original
bytes and the original SHA-256 remain authoritative. A `<SubPageTitle>` is a
label, not a page. Legacy course-shell SWFs are out of scope.

The current source audit expects 44 canonical lesson XML files and 2,282
active page placements:

| module | lessons | active placements |
| --- | ---: | ---: |
| NMS002 | 12 | 638 |
| GEO001 | 12 | 595 |
| ALG001 | 12 | 647 |
| DAT001 | 8 | 402 |
| **total** | **44** | **2,282** |

The private tree currently has no FLA files. This is recorded as a source
lineage gap, not silently treated as a paired FLA/SWF source. The GEO L1
`_alternate` tree, Stagingv4 conflicts, nested ZIPs (including the literal
`DA001.zip` spelling), unresolved keyterm references, and inactive/commented
references are retained in separate ledgers and are not part of the canonical
denominator.

## Local command sequence

Run all commands from this worktree. Commands that can materialize output must
write to an exclusive run directory under `work/` or another explicitly
configured private staging root.

```bash
npm run doctor
npm run verify:sources

SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'
HELP_MATH_G678_SOURCE_ROOT="$SOURCE_ROOT" node scripts/audit-shared-source.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --source-root "$SOURCE_ROOT" \
  --classification-manifest "$SOURCE_ROOT/classification-manifest.jsonl" \
  --missing-dependencies "$SOURCE_ROOT/missing-dependencies.jsonl" \
  --output catalog/g678-shared-catalog.v1.json \
  --check \
  --strict-counts \
  --require-source
```

`source:g678:audit` is the shortcut for the same strict check when
`HELP_MATH_G678_SOURCE_ROOT` is set. In strict source-required mode the audit
automatically discovers the five sibling witness files (README, summary,
classification, conflicts, and missing-dependencies), verifies their declared
SHA-256 values, and parses the already-hashed classification/dependency bytes.
If a witness is missing or drifts, the command stops before producing a
catalog; it never silently reports zero variants or dependency holds.

```bash
node scripts/map-shared-grade.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --mapping catalog/g678-grade-mapping.v1.json \
  --check

node scripts/map-shared-grade.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --mapping catalog/g678-grade-mapping.v1.json \
  --write \
  --output reports/g678-grade-mapping-readiness.json

node scripts/build-shared-page-factory.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --mode calibrate \
  --run-id <immutable-run-id> \
  --output work/g678-shared-page-factory/<immutable-run-id> \
  --require-read-only

node scripts/build-shared-page-factory.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --mode check \
  --output work/g678-shared-page-factory/<immutable-run-id> \
  --require-read-only

# Optional W2 machine structural audit for the 16-page calibration set.
# This invokes FFDec/swfmill only; it never creates JS or acceptance evidence.
node scripts/audit-shared-calibration-structure.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --catalog catalog/g678-shared-catalog.v1.json \
  --source-root "$SOURCE_ROOT" \
  --output work/g678-shared-page-factory/<calibration-structure-run-id> \
  --ffdec ffdec \
  --swfmill swfmill \
  --concurrency 2 \
  --timeout-ms 120000

node scripts/audit-shared-calibration-structure.mjs \
  --check \
  --profile catalog/g678-shared-source-profile.v1.json \
  --catalog catalog/g678-shared-catalog.v1.json \
  --source-root "$SOURCE_ROOT" \
  --output work/g678-shared-page-factory/<calibration-structure-run-id>

npm run generate:registry --workspace @helpmath/demos
npm run check:registry --workspace @helpmath/demos

node scripts/check-g678-governance.mjs --check

node scripts/build-g678-acceptance-matrix.mjs \
  --output reports/g678-acceptance-matrix.json
node scripts/build-g678-acceptance-matrix.mjs \
  --output reports/g678-acceptance-matrix.json \
  --check

node scripts/build-g678-page-only-release-manifest.mjs \
  --check \
  --output catalog/g678-page-only-release-manifest.v1.json

npm run typecheck
npm run lint
npm run test:site
```

The factory command has three intentionally separate modes:

- `calibrate` selects and audits the representative slice;
- `extend` processes an explicitly frozen page batch;
- `check` re-hashes and replays the run without overwriting it.

The `factory:g678:extend` npm alias is a guarded command template, not an
unscoped batch operation. Always append one explicit selector (`--module-code
... --lesson ...`, `--batch ...`, or `--all`) together with a fresh `--run-id`
and exclusive `--output`; an unscoped extend invocation must fail closed.
Likewise, use a new run directory for each calibration build rather than
reusing the sample `calibration-v1` path.

Archive receipts for the two multi-gigabyte recovery ZIPs are deliberately
kept separate from the factory profile. The current read-only, complete EOF
rehash is recorded in
`reports/g678-raw-zip-custody-verification-20260901.json` and has status
`CUSTODY_VERIFIED_NO_PROMOTION`; both outer ZIP hashes and both member-manifest
hashes match their declarations. This is custody evidence only. The factory
still requires a new profile/run binding before treating that receipt as an
input, and no source promotion, extraction, or publication is implied.

The review queue is materialized by
`node scripts/build-g678-review-packet.mjs --write --source-root <root>
--output <new-run-file>`. The committed v5 packet records all 46 same-path
conflicts, all 59 GEO alternate placements (33 differing SHA-256 values), all
92 dependency holds plus the NMS cross-lesson alias, the 5,562 grouped FQ/EA
candidates, license dispositions, and all 16 calibration placements. It
intentionally keeps every source-choice, dependency, audio, license, and
behavior decision pending; v1--v4 packets in the working tree are superseded
diagnostics from earlier packet revisions.

The command may produce a structural candidate, but it must never mark a
page `registered`, `strict-complete`, or `published` by itself. A reusable
behavior fix belongs in the IR, generator, or maintained adapter and must be
regenerated; generated output is never hand-edited.

For G678 specifically, `extend`, `--batch`, and `--all` are fail-closed until
the profile contains a hash-bound `representativeProductPathGate` (or
`scaleOutGate`) with a `GO` status, 16/16 registered calibration pages,
modern-My-Lesson, Replay/interaction/audio, desktop/mobile QA, and a receipt
SHA-256. The guard is enforced by
`ensureScaleOutAuthorization`; the current profile has no such receipt and
therefore returns `SCALE_OUT_NOT_AUTHORIZED` even for a dry-run.

The current checked-in mapping report is intentionally `blocked`: the 44
records are pending independent Common Core review and no official CCSS
snapshot has been hash-bound. `--require-approved` is available for a CI gate
that must fail rather than return a structured blocked report. Do not replace
the pending mapping with a guessed grade to make a route appear.

The official standards witness is
`catalog/ccss/ccss-math-2010-v1.snapshot.json`, bound to the Common Core State
Standards Initiative Mathematics PDF at `corestandards.org` (1,242,082 bytes,
SHA-256 `2d28ded26c7394f55525550e32bb96786da2e9a3276ccca8873e80ebcdebab11`).
`catalog/ccss/ccss-math-2010-v1.authority-receipt.json` is an unsigned,
acceptance-neutral receipt template. It must receive a named independent
authority reviewer and approval statement before any of the 44 mapping records
can unlock a grade route.

The current successor authority receipt is
`catalog/ccss/ccss-math-2010-v1.authority-receipt-approved-20260901T104409Z.json`.
It records Dr. Peter Hu's exact approval statement and approves only the frozen
CCSS Mathematics snapshot as the standards corpus for mapping review. The
derived successor readiness report correctly removes the snapshot-authority
blocker while retaining `44-lesson-mappings-not-approved`; no grade route is
opened by the corpus approval alone.

Current governance inputs record Dr. Peter Hu as product owner, Owner approver,
CCSS authority reviewer, procurement owner, and approver of a USD 1,000 weekly
planning cap. Professor Eric is named only as the primary math/CCSS reviewer;
his qualification, independence, and at-least-eight-hour weekly commitment are
not yet verified. A bounded read-only search of the mounted American Dream
project backup found historical G3-G5 governance receipts but no current G678
named backup identity/capacity receipt. A storage backup is not a named-human
backup assignment: each required backup stays null until an exact G678 path,
person, role, and committed weekly hours are reviewed.

A successor Owner assignment intake now also records Dr. Peter Hu as the
primary migration lead, factory/toolchain engineer, integration engineer,
QA/strict authority, authorized original-runtime operator, Spanish reviewer,
audio reviewer, independent visual reviewer, and release custodian. These are
valid records of the Owner's assignment intent, but they do not satisfy the
independence contract: the same person cannot independently validate or sign
their own implementation, original-runtime evidence, Spanish review, visual
review, strict evidence, and Owner acceptance. The assigned governance roles
carry an aggregate minimum of 88 hours per week for Dr. Peter Hu, while no
committed capacity was supplied. The governance checker therefore keeps M0
blocked on capacity, all backup slots, and the explicit identity-overlap
conflicts until independent replacement reviewers or reviewed exceptions are
provided.

The web route has a second defense-in-depth check: even an individually marked
`approved` mapping cannot create a grade URL until the hash-bound readiness
report says `authority-approved` and `gradeRouteGenerationAllowed=true`. A
stale, missing, or unsigned readiness report leaves every shared card locked.

`catalog/g678-review-governance.v1.json` is the machine-readable M0 staffing
gate. It intentionally contains null primary/backup assignments and a null
budget cap; `governance:g678:check` therefore returns `blocked`. No identity is
invented by the migration tooling, and M0 cannot be reported ready until the
Owner supplies distinct named people, backups, time capacity, and budget.

`catalog/g678-page-only-release-manifest.v1.json` is the isolated G6-G8
source-of-truth membership plan. It contains 44 atomic, page-only lesson
definitions and 2,282 source-ordered members, but every member is explicitly
`unregistered-source-bound`; it is not consumed as a release/publication
authority until mapping, registry, runtime, fidelity, audio, review, and
strict gates have independently passed.

## Grade mapping contract

The four module codes are a shared middle-school source scope, not grade
identifiers. Mapping uses the frozen Common Core Mathematics snapshot recorded
by `mappingVersion` in `catalog/g678-grade-mapping.v1.json`.

Each lesson receives one stable `stableLessonKey` and, only after review, one
`primaryGrade` (`6`, `7`, or `8`). Other approved grade interpretations are
stored as `gradeTags`; they do not create duplicate placements, routes, cards,
or progress records. A mapping remains `needs-adjudication` when it lacks a
grade-specific authoritative source, has a tie, or contains conflicting
page-level evidence. Such a lesson is visible as locked metadata in local All
Lessons and has no learner route.

The mapping record stores source path, source SHA-256, CCSS codes, evidence
locators, reviewer identities, score rationale, status, and the mapping
version. A later mapping decision creates a new version and invalidates any
route/descriptor evidence derived from the prior version.

## Factory lanes and product admission

Lane selection is based on the complete SWF audit (scripts, clip actions,
nested timelines, morphs, filters, audio, host calls, and state transitions),
not root frame count or file size:

| lane | implementation route |
| --- | --- |
| `low` | calibrated FFDec/swfmill extraction plus deterministic generator |
| `interactive-understood` | extraction plus a maintained adapter/state machine |
| `behavior-heavy` | behavior-first evidence and bounded advanced-manual implementation |

The representative calibration is four pages per module: one page from each
lane plus one risk sentinel covering any missing FQ/GS/TI, nested, random,
audio, Replay, morph, or dependency behavior. Every calibration page must
reach the complete product path:

```text
source → audit → IR → candidate → maintained module → registry →
source-ordered descriptor/navigation → modern My Lesson → Replay/browser QA
```

Only a calibration with every selected page at the registered Current-JS gate
authorizes extension of the same lane. Any critical failure records
`NO-GO-scale-out`; the failed page stays in evidence and a new run ID is used
for a bounded repair.

Extraction may cache by `assetId = swf-<full-sha256>`, but registration remains
placement-level. Batch size is capped at 25 placements and a lesson is not
admitted to All Lessons until all of its active placements are registered.
Shared adapters use the generic `PageAudioCandidate` contract exported by
`packages/demos/src/contract.ts`; its binding is explicitly one of `FQ/EA`,
`FQ/SA`, or `lesson-SA`, and intake emits only `candidate-index-only` until a
natural original-runtime listening session and named reviewer exist.

## Local All Lessons states

The web application consumes source-backed shared lesson metadata in addition
to the historical G3–G5 sample. It presents one card per stable lesson:

1. `source-mapping-pending`: visible under `G6–G8 shared`, locked, with no
   route;
2. `engineering-preview`: all active pages are `N/N registered`, descriptor
   and navigation hashes match, and the modern My Lesson host can render the
   complete sequence; available only in local development;
3. `strict-complete`/`released`: a future state controlled by strict and
   release ledgers.

Engineering-preview cards and pages must display the boundary that original
Flash behavior, fidelity, audio, human review, Owner acceptance, strict
completion, and release are still pending. The local feature flag is ignored
in production. G6–G8 routes are module-aware (for example
`/en/courses/6/nms002/1`) so lesson-number collisions cannot select the wrong
module. Existing G3–G5 routes remain unchanged.

The public course allowlist, sitemap, robots, and showcase publication flags
remain unchanged. The preview route is noindex and is not a production
publication signal. Existing G4 L3 sample progress/Words data must not be
presented as G6 learner data.

## Evidence gates after engineering preview

For every accepted page/lesson, continue in order and retain independent
records:

1. authorized original-runtime evidence (natural trace for nested,
   interactive, branch, random, scoring, Replay, and audio behavior; direct
   seek only for linear root-only frames);
2. full-frame coverage-v2 baseline/implementation manifests with identical
   native stage, frame domain, font, crop, DSF, scenario, language, seed, and
   entry-state hash;
3. fidelity comparison with static RMSE `≤ 0.05`, transition target `≤ 0.08`,
   exact dimensions/timing, and inspection of every diff;
4. source-bound audio inventory and named-human listening acceptance, or
   source-bound `accepted-not-required` evidence;
5. independent, append-only human visual review covering all keyframes and
   full-frame diffs;
6. separate Owner acceptance;
7. strict validator without `--allow-draft`, completion ledger, and exact
   atomic lesson-release ledger.

Ruffle, screenshots, machine audio decode, a JavaScript candidate, or a
checkbox cannot substitute for any of these gates. A source/generator/IR/
adapter change creates a new run and reopens all affected downstream gates.

## Failure handling and rollback

- Never overwrite a source, run, generated module, registry entry, or evidence
  record in place.
- Keep failed staging directories and diagnostics for forensic review.
- Disable the local preview flag to hide all G6–G8 learner links without
  deleting evidence.
- Roll back by selecting the prior immutable catalog/registry/descriptor
  manifest, not by editing generated files or deleting the failed run.
- A missing source, unresolved variant/dependency, non-deterministic rebuild,
  unexpected network request, console error, missing reviewer/backup, or
  license uncertainty blocks the affected lane.
- Do not run provider, GitHub, Vercel, production, or public SEO commands as
  part of this local implementation.
