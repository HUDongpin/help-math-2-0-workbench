# Reproducible Product Integration Pipeline

Use for a reviewed page family whose implementation must reach the actual
modern My Lesson. Structural generation alone is not product success.

## Existing Admitted Recipe

Run from the repository root:

```sh
node scripts/run-flash-product-pipeline.mjs --plan
node scripts/run-flash-product-pipeline.mjs
node scripts/run-flash-product-pipeline.mjs --resume
node scripts/run-flash-product-pipeline.mjs --until course-order
```

The maintained recipe is [product-pipeline.g4-l3.json](product-pipeline.g4-l3.json).
It admits only existing G4 L3 TS007/TS008 implementations. This is a product
integration continuation, not a generic raw-SWF importer or authorization to
admit arbitrary new pages. The existing G6-G8 shared-page factory remains a
separate source-extraction front end; do not replace it with this G4 recipe.

The sequence is:

1. Rehash preserved SWF and frozen script/XML extraction; retain extraction tool
   versions. Missing/drifted inputs block this recipe. It does not claim a fresh
   extraction or rewrite old evidence to make hashes agree.
2. Follow the explicit behavior disposition: retain TS007's maintained adapter;
   compile TS008's admitted behavior IR after independent source checks.
3. Run each page's source-specific behavior tests.
4. Regenerate the official registry from existing reviewed membership. This
   updates the generated registry, not admission policy or strict status.
5. Verify actual source XML hash, exact registry identities, unique placements,
   source order and the maintained modern lesson descriptor. A missing or
   mismatched membership blocks; it is not silently inserted or reordered.
6. Run fresh browser tests on `/courses/4/3` in My Lesson. Exercise answer,
   feedback completion, persisted lesson completion, Replay and navigation
   away/back at the admitted mobile viewport. Browser traffic outside loopback
   is blocked by the test. The dedicated local profile keeps authentication and
   Nova off. The default browser channel is installed Chrome.

The current browser scope is English TS007/TS008 at 390px. It does not establish
Spanish content, audio listening, all viewport/device coverage or whole-catalog
support. Other required language/audio/interaction checks remain explicit work.

## Cache And Resume Contract

The runner in `scripts/lib/flash-product-pipeline.mjs` uses content hashes, not
mtime, for declared inputs and generated outputs. A key includes the stage
recipe, prerequisite keys, runner/checker code, lockfile, Node/Python versions,
platform and architecture. Recorded extraction versions belong to the frozen
source evidence; browser version is attached to the actual browser test.

Only passed stages can populate the cache. A hit requires current output hashes
to match. Each new run rechecks inputs; successful stages from an interrupted
or failed run may be reused, but a failed stage is rerun. Final input/output
rehashing detects edits made during the run. Actual My Lesson verification is
never cached.

The graph explicitly lists consumers of `practice-question-feedback.ts`.
Changing it invalidates TS007 behavior verification and TS008 generation/behavior
plus downstream integration checks. Source extraction checks can stay cached.
Unrelated pages are not rebuilt by this admitted recipe. This is declared
dependency tracking, not a claim that arbitrary dynamic imports are discovered.
When expanding the recipe, include every generator, imported behavior module,
source, configuration, asset contract and test that can affect a cached result.

Runs are serialized with `work/flash-product-pipeline/running.lock`. A hard-killed
runner can leave that lock: verify its process has stopped before clearing it;
never remove a live run's lock. Independent browser scenarios run serially.

Each run has its own directory under `work/flash-product-pipeline/runs/` with
stage logs, input/output hashes, prerequisite keys, commands, flags, tool
versions, statuses and a receipt. Browser failures retain their traces in that
run's browser directory. Atomic receipt/cache writes avoid accepting partial
JSON as a valid success. Keep historical failed receipts.

## Meaning Of The Result

- `plan`: no stage commands executed.
- `partial`: stopped at an explicitly requested intermediate stage.
- `failed`: an input, generation, integration or host check failed; inspect its
  receipt and stage log, then resume after resolving the specific issue.
- `product-host-verified`: the admitted local recipe reached fresh My Lesson
  checks. This is technical product behavior evidence, not fidelity, listening,
  human/Owner acceptance, strict completion, public release or deployment.

Before admitting a new page/family, use [capability-support.md](capability-support.md)
and the source-bound registration/descriptor workflow. Add exact membership and
source ordering only through a reviewed implementation change, then extend the
recipe and browser journeys. Do not infer lesson-wide coverage from these two
passing consumers.
