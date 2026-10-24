# HELP Math lesson typography development contract

This work modernizes the text students read inside JavaScript lesson animations.
Mathematical meaning, instructional state, answer timing, interaction and audio
coordination remain source-bound. Student-facing text uses modern browser fonts,
semantic text and responsive composition. Original Flash text positions and
outlined glyph styling are historical evidence, not the new typography design.

The G3–G5 program denominator is 1,751 active page placements in 29 lessons.
Repeated source assets still have separate placement identities. Legacy course
shell SWFs are excluded. G6–G8 has its own 2,282-placement, 44-lesson denominator;
it is never added to the G3–G5 count or inferred from the older 73/74-lesson claims.

## State and evidence model

`catalog/typography-v1/progress.json` is generated from the current source catalog,
raw SWF hashes, maintained page bindings, implementation files and independent
check/review records. It does not copy completion labels from a registry or an
older receipt. The stages are separate:

| State | Required evidence |
| --- | --- |
| Source catalog current | Source asset gzip/content hashes and identity match; actual SWF bytes match the placement |
| Structural extraction parsed | The extractor parsed the structural tags; this is not semantic reading order, behavior or typography acceptance |
| Binding current | Versioned placement/source identity, supported template, known text IDs and unambiguous reading order |
| Implementation files current | Nonempty implementation inventory; every actual file hash matches its declared hash |
| Implementation candidate | Current binding and implementation files; a self-declared `implemented` status is insufficient |
| Implemented | Exact candidate evidence verifies all teaching-text dispositions, native text, math, state/Replay and real host integration; no unresolved implementation risks |
| Technically verified | The implemented candidate additionally passes the complete responsive, accessibility, bilingual, lifecycle, resource and performance matrix |
| Human review performed | A named, timestamped actual review of this exact current candidate, including failed reviews |
| Human review passed | A current, named, timestamped human review record for the exact verified candidate |

The report retains all structural risks. In particular, `parsed` does not resolve
shape text, text embedded in bitmaps, unknown runtime values, masks, button state
or ActionScript interpretation. An empty `binding.unresolved` list cannot erase
those risks: the independent technical record must explicitly resolve each kind
with current artifact evidence. Unknown/unresolved findings remain in the report.

`unresolved` contains real technical problems, including unimplemented source
glossary actions, unreadable bitmap text, unknown dynamic values and failed checks.
Keep pending original-runtime/fidelity, listening, human, Owner and publication
acceptance in `independentPending`; those independent decisions cannot be a
circular prerequisite for the preceding technical stage. Missing Spanish
translation remains explicit and separate from a verified English fallback.
Preserve superseded combined boundary wording as historical notes when splitting
older records; never move an unimplemented teaching behavior out of `unresolved`.

This ledger validates a human review record's structure and artifact association;
it cannot authenticate the named person by itself. Codex must not invent a reviewer,
review date, decision, signature or source inspection. No generated record changes
original-runtime authority, Flash fidelity, audio acceptance, Owner acceptance,
strict completion, release, lesson publication, Nova or LRS acceptance.

## Maintained page interface

The runtime interfaces are `LessonTextBinding`, `LessonTextPresentationCapability`
and `TextPresentationSnapshot` in `packages/demos/src/lesson-text-contract.ts`.
Maintain a JSON binding per placement in `catalog/typography-v1/page-bindings/`.
Its core fields follow `LessonTextBinding`:

```ts
{
  schemaVersion: 1,
  version: string,
  placementId: string,
  animationId: string,
  sourceSwfSha256: string,
  template: "explanation" | "exercise" | "complex-figure",
  blocks: LessonTextBlockBinding[],
  implementation: {
    status: "candidate" | "implemented",
    files: Array<{path: string, sha256: string}>
  },
  unresolved: string[],
  independentPending?: string[]
}
```

The implementation inventory covers all files that can change that page's text,
layout, behavior and relevant assets: maintained page adapter/state, shared text
renderer and CSS, font files or their bound manifest, and any regenerated visual
adapter used for suppression. Listing only one thin entry module does not bind
its dependency closure. Paths are repository-relative ordinary files; escaping
paths, duplicate entries, missing files and changed bytes are rejected.

Each block binds source text IDs, semantic role, content language, reading order,
value source and, where necessary, an exact instance path. Exact instance identity
includes timeline, depth, placement generation and character; reusing a character
elsewhere must not suppress all occurrences of that character. The source IDs are
resolved from the verified source asset, not recovered from a rendered screenshot
or guessed from the English page title.

An outlined mathematical symbol may instead bind `sourceShapeIds: number[]`.
Keep `sourceTextIds: []` when no source text definition exists; never invent a
text ID or accept an arbitrary character as a shape. Every referenced shape must
exist in the verified asset's `shapeDefinitions`, and the page JSON must include
an explicit `sourceRoleDecisions` entry:

```ts
{
  kind: "outlined-text",
  sourceShapeIds: number[],
  sourceShapeHashes: Array<{characterId: number, sourceTagSha256: string}>,
  semanticValue: string,
  role: LessonTextRole,
  reason: string
}
```

The ledger validates each shape's exact source-tag hash and role association.
This records a source-grounded interpretation; it does not create a human review
or turn an unclassified shape into a successful modernization automatically.
Decorative omissions belong in separate source-role decisions, with exact source
text/shape references and a reason; instructional mathematical values remain in
the student-facing presentation.

`buildLessonTextSnapshot` derives values and visibility from the page's existing
state and runtime context. It owns no timer, random generator or audio clock.
Missing required values produce `blocked`; the system must not invent content,
unhide an answer or remove source text when a modern replacement is unavailable.
One snapshot feeds both the visible browser text and exact old-text suppression.
Replay resets the existing complete teaching state and therefore the text state.

An optional `prepare()` waits for hash-bound graphics and adapter readiness before
the host starts the opted-in presentation clock. It does not run in the original
one-argument module loader or source-evidence capture mode. Source feedback child
timelines run on the same host clock while their parent holds. A source Close
edge can enter an outro during an intro only when `entryFromActivity` declares
the exact source ID and frame range and the request carries the current activity
ID/revision. Stale events, arbitrary child jumps and duplicate requests fail.
Media uses the selected source frame offset; an audio-ended event never advances
the teaching state.

Source glossary links may declare `keyTerms` with their exact master XML ID/hash,
index language and page-authored entry IDs. The candidate host accepts only those
IDs with the current animation identity and the source stop disposition. It opens
the existing semantic Key Terms tool, preserves the source index even on an ES
route, stops the host timeline/audio and returns focus on close. Closing does not
override an authored stop: playback resumes only through explicit Resume. No
legacy URL, `getURL`, external navigation or network callback is executed.

`LessonTextPresentation` supplies explanation, exercise and complex-figure
composition. Prose is HTML; graph labels remain actual text. Labels can follow
figure geometry without shrinking their font with an entire 800px stage.
DOM reading order and visible instructional order must agree. Interleaved prose,
special masks or unusual diagrams that do not fit the shared template require a
maintained page renderer rather than silently rearranged instructional content.

Use the versioned local font inventory in `catalog/typography-v1/fonts.json` and
the shared typography tokens. Font fallback, unavailable translation and Canvas
resolution limits must be explicit. An ES route displaying English source text is
`source-fallback`; it must carry its actual content language and is never counted
as a Spanish translation. New ES text requires source/translation evidence plus
Spanish content and layout verification.

## Independent checks, candidate hashes and review records

Implementation and technical records are JSON files in `catalog/typography-v1/checks/`. Keep old
records; create a new dated record after changes. Records for unknown placements
are rejected. A candidate has these independently recomputed identities:

- `bindingSha256`: SHA-256 of the exact page-binding file bytes.
- `implementationHash`: SHA-256 of the canonical, path-sorted current
  implementation `{path, sha256}` inventory.
- `candidateHash`: SHA-256 of canonical `placementId`, actual `sourceSwfSha256`,
  `sourceCatalogContentSha256`, `bindingSha256`, and `implementationHash`.

The generator exports `typographyImplementationHash` and
`typographyCandidateHash` so test runners can use the same contract. The generated
page row also carries these values for the exact current candidate. Use this record
shape only after the associated checks really run:

```ts
{
  schemaVersion: 1,
  kind: "lesson-typography-implementation-v1" | "lesson-typography-check-v1",
  placementId: string,
  bindingSha256: string,
  implementationHash: string,
  candidateHash: string,
  checkedAt: string, // ISO timestamp from the actual check
  checks: {
    sourceBinding: "passed" | "failed" | "not-run",
    semanticText: "passed" | "failed" | "not-run",
    mathSemantics: "passed" | "failed" | "not-run",
    timingAndReplay: "passed" | "failed" | "not-run",
    teachingTextDisposition: "passed" | "failed" | "not-run",
    hostIntegration: "passed" | "failed" | "not-run",
    responsiveTypography: "passed" | "failed" | "not-run",
    accessibility: "passed" | "failed" | "not-run",
    bilingualPolicy: "passed" | "failed" | "not-run",
    performance: "passed" | "failed" | "not-run",
    lifecycle: "passed" | "failed" | "not-run",
    resourceStability: "passed" | "failed" | "not-run"
  },
  resolvedSourceRisks: string[],
  languagePolicy: {
    en: "source" | "translated",
    es: "source" | "translated" | "source-fallback" | "unavailable"
  },
  artifacts: Array<{path: string, sha256: string}>
}
```

Implementation evidence requires `sourceBinding`, `semanticText`, `mathSemantics`,
`timingAndReplay`, `teachingTextDisposition` and `hostIntegration`. It can precede
the full matrix and never creates technical or human passage. Full technical
records must pass every required check. `resolvedSourceRisks` is a disposition supported
by the referenced analysis/runtime evidence, not a list copied from the source
catalog just to satisfy the verifier. Nonempty artifact inventories are rehashed.
The newest record for the same candidate controls the technical outcome; a later
failure cannot be hidden behind an earlier success. A later performance failure
can retain verified implementation while invalidating full technical passage;
a later missing-text, math or state failure invalidates implementation too.

Human records in `catalog/typography-v1/reviews/` use
`kind: "lesson-typography-review-v1"`, the same placement/binding/implementation/
candidate hashes, a real `reviewer`, actual `reviewedAt`, `verdict: "passed" |
"failed"`, and a nonempty artifact inventory. A placeholder, AI agent name,
missing timestamp or mismatched hash cannot produce human-review credit. This
workflow does not generate such records or turn an engineering reviewer into
the Owner. A later failing review supersedes an earlier success for that candidate.

Changing the raw source, extracted content, page binding or any bound implementation
file invalidates dependent checks and review. The old evidence remains historical.
If a source path exists in multiple allowed source roots, a changed first source
fails closed; the checker does not silently select an older matching copy.

## Representative set and validation matrix

`representative-pages.json` freezes at least 24 placement IDs. It always includes:

- `course-g04-l03-in-002`, `course-g04-l03-in-004`, `course-g04-l03-ts-008`;
- `course-g03-l01-ts-008`, `course-g04-l05-in-012`, `course-g05-l04-fq-001`.

First select those required pages, then uncovered source-structure types, then
descending source risk and structural text density, with placement ID as the
tie-breaker. The current density measure is decoded source characters per
800×600-equivalent source stage area across all text definitions. It prioritizes
inspection; it does not claim that all characters appear simultaneously.

Types cover static/dynamic text, button states, bitmaps, masks/filters/blends,
unresolved glyphs, shapes, nested timelines, quizzes, practice, vocabulary and
dense text. Missing types are explicitly `unsupported`; additional easy pages do
not substitute for them. `selected-for-validation` means selection only, not
template support or acceptance. Subsequent builds preserve the frozen placement
membership and report changed source hashes rather than swapping easier pages in.

Representative validation calibrates the reusable solution. It does not close
the full-program denominator. Every later placement still requires its own
current binding, state coverage, technical record and any requested human review.

| Area | Required scenarios |
| --- | --- |
| Content and math | Correct strings, numbers, fractions, negatives, superscripts, units; actual DOM/SVG text; no missing glyphs |
| State and behavior | Initial/playing/paused/completed states; all answers and feedback paths; answer reveal; Replay; Next/Previous; progress restoration |
| Responsive typography | 320, 390, 768, 1280, 1440/1920 CSS px; long ES text; 200% text zoom; no clipped controls/prose; diagrams may use bounded local two-dimensional scrolling |
| Device density | DPR1/2/3; actual graph box; supported scale and capped state; source bitmap limitations |
| Accessibility | Keyboard and touch, correct hit targets, focus and reading order, semantic language, reduced motion |
| Lifecycle | Resize/orientation/DPR changes, sidebar changes, font loading/fallback; no audio restart, random reseed, duplicate controls or premature answers |
| Performance | Repeated frame/interaction measures and first-ready comparisons on fixed devices/builds; no context loss or repeated staging allocation leak |

The reusable Canvas helpers are optional and disabled by default. They require
explicit adapter metadata for supported 1×/2× scales, preserve fractional native
coordinates and use `ceil(nativeDimension × scale)` for the physical buffer.
Use `resolution.renderKey` for expensive redraws and the allocation result's
actual scale after a fallback. Release unused staging buffers on replacement or
unmount. Browser text remains independently clear when graphics are capped.

Pure resolution-only graphics changes keep the existing k=1 RGBA/state baseline
and documented k>1 downsampling comparison. Modern text/layout has a new semantic,
behavioral and browser-visual baseline; it must not be rejected for differing from
old outlined Flash typography. The earlier adaptive Canvas 52-runtime performance
failure set is not closed by the new helper unit tests or successful allocation.

## Reproducible commands and G6–G8 handoff

Run these from the typography worktree:

```bash
node scripts/build-lesson-text-source-catalog-v1.mjs --check
node --test scripts/build-lesson-typography-progress-v1.test.mjs
node scripts/build-lesson-typography-progress-v1.mjs
node scripts/build-lesson-typography-progress-v1.mjs --check
```

Generation rehashes the full current source/asset scope, reads real bindings and
evidence and writes the three derived reports. `--check` redoes the audit using
the stored observation timestamp, compares the reports and writes nothing. It
fails if inputs or records have changed; it does not make stale outputs current.
The source catalog is private local build evidence, excluded from web bundles
and deployment uploads; only bounded runtime text/config belongs in the product.

`g678-backlog.json` reads the external active G6–G8 manifest and private Current-JS
registry without modifying that worktree. It records exact input hashes and an
observation timestamp, counts registration entries, independently rehashes their
declared module artifacts, and leaves typography unassessed. A registry/module
hash match is not browser runtime verification or typography acceptance.

The active G6–G8 integration status is
`prepared-not-applied-to-active-g678-worktree`. The new-page rule is ready to
merge through `tools/shared-page-factory/README.md`: every new or changed page
must adopt the text/state/layout interface and its own source-bound typography
check record before it can be counted as modernized. Do not rewrite old G6–G8
factory schemas or immutable receipts to suggest the rule was applied earlier.
