# Verifiable Conversion Support

Use this reference before calling a page automatically convertible or extending
a factory to a new behavior family. Complexity is a planning dimension, not a
capability declaration. This is a bounded support inventory, not a universal
Flash/AVM1/AVM2 converter specification.

## Read Support In Separate Dimensions

- **Extracted:** source objects/actions are identified and source-bound.
- **Candidate generation:** a named generator can reproducibly build the exact
  supported input family. A current `--check` must pass before calling an
  existing generated candidate current.
- **Maintained implementation:** an existing adapter or state machine implements
  the listed rules. This does not imply automatic extraction of those rules.
- **Verified behavior:** named tests ran against the bound implementation and
  tested the listed outcomes. Pure tests do not prove browser host wiring.
- **Unassessed/blocked:** either no support assessment exists, or a concrete
  missing rule, dependency, unsupported construct, or input drift prevents it.

Keep these dimensions separate. A page can have passing implementation tests
while its generator is blocked. Missing evidence means unassessed, not globally
unsupported and not implicitly supported.

## Initial Source-Checked Inventory — 2026-09-27

The source hashes, implementation/test bindings, executed command and first
generation failure are recorded in
[`flash-capability-support-audit-2026-09-27.json`](../../../reports/flash-capability-support-audit-2026-09-27.json).
All three preserved SWF hashes matched their migration manifests. The 34
selected tests passed. This dated sample does not inventory the whole catalog.

| Capability | Observed implementation and verified subset | Automation boundary and handling of unsupported content |
| --- | --- | --- |
| Timeline, placement, scale, alpha | IN009 has an FFDec Canvas adapter, deterministic one-indexed frame state, and separate root/sprite-200 domains. Tests cover frame identity and existing generated assets. | Current regeneration is **blocked** by audio-audit hash drift. This check stopped at its first failure. Report unknown drawing objects/effects and exact domains; do not claim all transforms/effects or arbitrary timelines supported. |
| Click, jump, Replay | TS008 implements its four walkthrough steps, reveal/Close obligations, question entry, feedback completion and complete reducer reset. | Existing maintained page adapter. New jump targets/conditions require source mapping; arbitrary ActionScript is not automatically translated. Pause/audio/host lifecycle need their own checks. |
| Choice, feedback, score | TS008 checks A–D, correct answer D, first-wrong retry, second-wrong termination and counter reset. Shared feedback selection is used by TS007/TS008. | Supported subset is feedback and attempt state, **not general scoring**. Keep unknown predicates, score rules and destinations explicit; do not mark source behavior complete. |
| Drag and matching | TI003 binds six cards to exact number-line targets, wrong-drop recovery, feedback locks and Replay. Tests exercise all 720 card orders. | Existing page-specific adapter, not a general shared drag compiler. New geometry, hit rules, ordering or matching semantics require an explicit mapping and tests. |
| Random selection / question generation | TS008 uses normalized seed modulo three wrong/four right feedback choices; shared helper tests cover deterministic selection. | This is feedback selection, not randomized question generation or Flash random equivalence. Unresolved random range, distribution, state advancement or seed semantics remains blocked for that claim. |
| Nested playback | IN009 separates its ten-frame root and sprite-200; TS008 separately models sprite-350 interaction entry and source-specific visual donor rules. | Exact domains are supported locally. Placement-entry clocks, dynamic nesting and natural runtime reachability cannot be inferred from a working Canvas. Record unresolved domains individually. |
| Audio and old host calls | TI003 source contains `Coach_audio_2`, feedback and parent calls; its implementation explicitly retains unresolved host feedback/continuation and unmodeled audio. | Detection is not conversion. List each target, audio owner/clock and modern host adapter. Do not silently drop calls or use a generic cue to claim completion. |

Source extraction anchors include the per-example
`audit/machine/ffdec-scripts.txt.gz`. TS008's source contains
`_global.quizTryCount` and its reset; TI003 contains `startDrag`, `stopDrag`,
parent feedback and coach-audio calls. The audit binds those extraction files;
they do not replace original-runtime evidence.

No example in this initial audit establishes whole-page one-click conversion.
Existing source-bound implementations remain usable within their own current
contracts; the inventory does not demote their registration or promote fidelity.

## Assess An Actual Page

Before proposing automatic conversion, record in its existing migration audit:

| Field | Required meaning |
| --- | --- |
| Source | Exact animation/placement, SWF hash, extraction/tool version and source evidence path. |
| Required capabilities | One row for every reachable behavior, effect, timeline, audio dependency and host call; record unresolved/dynamic references explicitly. |
| Source location | Object/sprite, frame, event/handler or source range that requires the capability. |
| Implementation route | Existing generator, maintained shared adapter or bounded page implementation; give its path/version and exact supported subset. |
| Configuration | Page-specific options, predicate, feedback, score, target frame, geometry, random semantics or audio/host mapping. |
| Verification | Exact command, execution result, tested outcome and code/source binding; distinguish state tests, browser journeys and original-runtime evidence. |
| Missing support | Concrete unresolved target/rule/dependency, impact and next bounded action; do not replace this with a complexity label. |

Derive the decision from all required capability rows:

- **Automatic candidate allowed:** every required capability maps to an
  already calibrated generator/adapter contract; inputs and generation checks
  are current; no unknown reachable behavior remains. Name the exact admitted
  family and next product checks. This is still not strict acceptance.
- **Adapter work required:** known semantics need a maintained mapping or
  bounded implementation. State which parts can already be extracted/generated
  and which require work. Reuse the shared-behavior decision in
  [renderer-implementation.md](renderer-implementation.md#shared-behavior-reuse).
- **Blocked for automatic completion:** a required rule, source, binding or
  dependency is unresolved. Preserve useful extraction/candidates, identify the
  blocker and continue independent bounded work without labeling the page
  behavior-complete.

Do not automatically classify all pages from filename, tag count, low
complexity, a sibling's success, or this example table. Do not repair evidence
drift by merely refreshing expected hashes. Reconcile why the input changed,
then rerun the affected generation and behavior checks.

## Reverify The Initial Examples

Run from the repository root:

```sh
node --import tsx --test packages/demos/tests/course-g04-l03-in-009.test.ts packages/demos/tests/course-g04-l03-ts-008-practice-question-interaction.test.ts packages/demos/tests/course-g04-l03-ti-003-number-line-drag-interaction.test.ts packages/demos/tests/practice-question-feedback.test.ts
node scripts/build-in-009-ffdec-canvas-candidate.mjs --check
```

Rehash the receipt's files before reusing the dated result. A newly passing
generator check updates generation status only; it does not establish other
capabilities, visual fidelity, listening, human/Owner acceptance or publication.
