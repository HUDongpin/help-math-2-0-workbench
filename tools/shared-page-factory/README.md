# G6–G8 shared page factory runner

`scripts/build-shared-page-factory.mjs` is the profile-driven front end for the
four shared middle-school modules (`NMS002`, `GEO001`, `ALG001`, `DAT001`). It
locks XML/SWF identity and emits a reproducible structural manifest. It does
not run AVM1, invoke an authoritative Flash runtime, generate a maintained
JavaScript renderer, register Current-JS, accept fidelity/audio/review, or
release a lesson.

## Commands

```bash
# Inspect a bounded calibration set without writing anything.
node scripts/build-shared-page-factory.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --mode calibrate --dry-run

# Build structural evidence into a new, create-exclusive work directory.
node scripts/build-shared-page-factory.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --mode calibrate \
  --output work/g678-shared-page-factory/calibration-v1

# Extend one module/lesson (a module-wide or catalog-wide run must be explicit).
node scripts/build-shared-page-factory.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --mode extend --module-code NMS002 --lesson 1 \
  --output work/g678-shared-page-factory/nms002-l01-v1

# Verify an existing run. With no scope flags the placement set is read from
# its FactoryRunManifestV2, so the source is re-hashed in the same order.
node scripts/build-shared-page-factory.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --mode check --output work/g678-shared-page-factory/nms002-l01-v1
```

`--source-root <path>` overrides the profile's external source root for a
controlled local invocation. The profile may instead specify
`sourceView.rootEnv` (default `HELP_MATH_G678_SOURCE_ROOT`) and
`sourceView.relativeRoot` (normally `G6-G8-shared`). A missing source view or
missing XML/SWF fails closed with a machine-readable error code; no source
archive is copied or modified.

## Profile shape

The runner accepts both the original `moduleDefinitions` shape and the current
profile shape (`sourceView`, `modules`, `activePageCounts`). See
`profile.schema.json` for the minimum contract. Module lesson directories are
resolved below the canonical root and each `L<NN>/index.xml` is projected in
source order. XML comments are excluded from the active projection; raw XML
bytes and SHA-256 remain authoritative. `<SubPageTitle>` is never counted as a
page.

Lane hints are optional but conservative. Without a source-bound hint, a page
is `unknown`/`hold-needs-source-audit`. A valid SWF signature alone never makes
a page generation-eligible. Profile flags for variants, unresolved
dependencies, or unsupported AVM1 features produce an explicit hold. All
shared pages are marked `swfOnly` because the current source view has no FLA
counterparts; this is evidence, not an acceptance claim.

## Artifact and safety contract

Each successful run contains:

* `run-manifest.json` (`FactoryRunManifestV2`) with profile/source/generator/
  toolchain/license/cache hashes and all acceptance gates false;
* `source-profile-lock.json`;
* `structural/lessons.json` and `structural/placements.json` aggregate projections;
* `structural/lessons/*.json` and `structural/placements/*.json`;
* `summary.json` with separate structural/candidate/registered/evidence/review/
  downstream funnels;
* `output-inventory.json`.

The machine-readable contract is
`schemas/g678-factory-run-manifest-v2.schema.json`.

Outputs are staged under a unique PID/UUID directory and atomically renamed
only when complete. Existing outputs are never overwritten. A failed build
retains its staging directory and writes `failure.json`. The content-addressed
cache is under `work/g678-shared-page-factory-cache/<cacheKey>` and stores
metadata only; it contains no runnable renderer or acceptance evidence.

The generated structural artifacts are inputs to a later IR/generator,
maintained adapter, registry, My Lesson, original-runtime, fidelity, audio,
human-review, Owner, strict, and release workflow. They must not be counted as
registered Current-JS or published lessons.
