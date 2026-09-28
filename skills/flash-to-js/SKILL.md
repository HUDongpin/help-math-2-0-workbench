---
name: flash-to-js
description: Audit or migrate HELP Math FLA/SWF page animations. Use for source intake, JavaScript/My Lesson integration, factory calibration, runtime evidence, acceptance, and lesson release.
---

# Flash To JavaScript

Recover the authored behavior before choosing a renderer. Preserve source evidence, make every timeline state queryable, and keep engineering output, original-runtime evidence, human decisions, and release state separate.

## Operating Contract

Treat these as distinct states. Never promote one into another by implication:

1. `structural/static evidence`: facts extracted from FLA, SWF, catalogs, screenshots, or reports.
2. `unregistered engineering candidate`: a runnable JavaScript implementation and deterministic captures that have not completed the reviewed product-registration path.
3. `registered Current-JS product integration`: the reviewed module and assets are in the official registry, the exact active placement is in the source-ordered lesson descriptor, and the modern My Lesson host can present it on the admitted private or product surface.
4. `authoritative original-runtime evidence`: hash-bound captures from an authorized original runtime for the exact requirement and trace.
5. `technical comparison`: full-frame manifests, metrics, diffs, behavior, product, and accessibility checks.
6. `audio acceptance`: source-bound machine evidence plus named-human original-runtime listening when audio is required.
7. `human visual review`: an immutable record created by the named person who inspected the complete visual evidence.
8. `owner acceptance`: a separate immutable decision by the owner or authorized representative.
9. `strict complete`: the strict validator and current completion ledger both pass.
10. `lesson published`: every required placement is strict complete, the atomic lesson-release ledger is technically eligible, and the externally anchored production-trust path admits the required preview, staged, and owner-promotion decisions.

Count a page toward page-level Current-JS coverage only at state 3. A private or local engineering registration may reach state 3 while states 4 through 10 remain explicitly false or pending. Registration does not grant original-runtime authority, fidelity, audio, human or owner acceptance, strict completion, release, or publication.

Ruffle is a versioned forensic reference and compatibility fallback. It is not an authoritative original-runtime baseline and cannot prove fidelity, audio, interaction causality, human review, owner acceptance, strict completion, or release readiness.

Legacy `baseline.route` or `baseline.renderer` manifest fields may identify a forensic playback surface; they do not establish strict authority. Coverage-v2 assigns original-runtime authority to each exact requirement and trace.

## Production And Source Boundaries

Use the compiler-assisted hybrid workflow by default: source-locked extraction,
versioned IR/configuration, reproducible generation, maintained product code,
exact registry/descriptor membership, and the modern My Lesson host.

- Route `low` pages through the calibrated factory; use extraction plus a
  maintained adapter/state machine for `interactive-understood` pages.
- Use bounded, source-evidenced advanced-manual implementation for
  `behavior-heavy` or exceptional pages when a representative slice or a
  documented accessibility/maintainability need justifies it. Every evidence
  and acceptance gate still applies.
- When resolving an exception, check existing consumers for reusable behavior.
  Follow the reuse decision in [renderer-implementation.md](references/renderer-implementation.md#shared-behavior-reuse)
  before copying a page-specific mechanism.
- `NO-GO-scale-out` stops bulk generation. Preserve the failed slice, record
  the lane-selection reason, and continue the smallest bounded implementation.
  Recalibrate before expanding it. Never hand-edit generated output.
- Preserve `source-assets/` and external archives byte-for-byte; source
  promotion requires the reviewed, hash-bound, rollback-safe intake path.
  Keep placement `animationId` separate from `assetId = swf-<full-sha256>`.
- Reuse the canonical migration workspace; never scaffold a second workspace from a filename alias.

## Select The Current Task

Follow applicable `AGENTS.md` instructions. Read only the references needed
for the requested stage; later acceptance gates do not require loading their
procedures during an unrelated edit. Read `PROJECT_MEMORY.md` and the historical
session index when continuing inherited work, `README.md` for unfamiliar
project layout, and `docs/TOOLING.md` for setup or tool problems.

| Task | Reference to load |
| --- | --- |
| Resolve a source/placement, import, or create a workspace | [source-intake.md](references/source-intake.md) |
| Inspect FLA/SWF/ActionScript or define the audit specification, including `audio-inventory.csv` | [swf-audit.md](references/swf-audit.md) |
| Decide whether a page or behavior family can be automatically converted | [capability-support.md](references/capability-support.md) |
| Design, calibrate, run, measure, or expand the factory | [factory-scaleout.md](references/factory-scaleout.md) |
| Model events, predicates, feedback, audio ownership, Replay or completion in an IR | [teaching-behavior-ir.md](references/teaching-behavior-ir.md) |
| Run an admitted generation-to-My-Lesson recipe with caching and resume | [product-integration-pipeline.md](references/product-integration-pipeline.md) |
| Implement/change a renderer, assets, or My Lesson integration | [renderer-implementation.md](references/renderer-implementation.md) |
| Prepare or conduct original-runtime work | [original-runtime-evidence.md](references/original-runtime-evidence.md), plus `docs/PILOT_ACCEPTANCE_RUNBOOK.md` and the requirement-specific protocol for pilot operations |
| Capture Current-JS, define coverage/trace identities, compare fidelity, or validate product behavior | [fidelity-validation.md](references/fidelity-validation.md) |
| Prepare audio, human visual review, or owner acceptance | [audio-and-review.md](references/audio-and-review.md) |
| Close a migration or change product visibility/publication | [lesson-release.md](references/lesson-release.md) |

## Validation Scope

Choose checks for the changed surface and requested gate. Use `npm run doctor`
for tool/environment changes, `npm run verify:workbench` for workbench/skill/
template contracts, and `npm run verify:sources` when relying on preserved
source inputs or changing source custody. Run the relevant behavior, Replay,
registry, host, and browser checks for implementation changes. Prioritize
student action outcomes using the [behavior validation matrix](references/fidelity-validation.md#student-action-outcomes);
assert post-action state, resource cleanup, and navigation results. Establish a
broader baseline for unknown failures or shared changes; complete required
checks and repeat or expand them only when new changes or concerns justify it.
An unrelated pre-existing failure is reported separately and does not prohibit
independent work; any dependent acceptance gate remains blocked.

Confirm the destination volume is writable and has safe free capacity before
large full-frame evidence generation. Keyframes are spot checks, not strict
full-domain coverage. Candidate captures, metric reports, and generated
templates never create original-runtime authority, human signatures, or
publication permission. Never invent a reviewer, sign, backdate, or overwrite
an immutable decision.

## Report The Result

Report changed files, animation/asset identity, the completed stage, relevant
test/build results, and independent blockers. For evidence or acceptance
handoff, include source hashes, stage/FPS/root and nested domains, route/package
paths, implementation and original-runtime capture status, full-frame metrics,
audio, accessibility, human/Owner records, and ledger/release status.

For factory work, report the operational funnel and candidate-to-product costs
from [factory-scaleout.md](references/factory-scaleout.md), separately for
factory and advanced-manual lanes. Structural output and candidate counts
never substitute for registered Current-JS.

Do not call a migration one-to-one, faithful, complete, accepted, or published
unless its corresponding evidence state above is satisfied.
