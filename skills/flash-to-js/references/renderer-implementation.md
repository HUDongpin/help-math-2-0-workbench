# Renderer Implementation And Product Integration

Use this reference when creating or changing an animation renderer, its assets,
or the modern My Lesson bridge. Base the implementation on the source-bound
specification in [swf-audit.md](swf-audit.md).

## Renderer Choice

- Use React + SVG for diagrams, formulas, labels, moderate object counts,
  editable vectors, and accessible controls.
- Use Canvas/CreateJS for timeline-heavy content when its display-list model
  materially reduces risk.
- Use Canvas with PixiJS for dense sprites, masks, filters, or
  performance-sensitive raster work.
- Use CSS only for layout and small presentation transitions, not as the
  timeline source of truth.
- Reject video for required interaction, localization, dynamic state, or
  accessible controls. The project's approval rule for non-interactive video
  remains in `AGENTS.md`.
- Keep Ruffle only as a forensic reference or an explicitly approved temporary
  compatibility fallback.

Document the selected renderer and material rejected alternatives in
`MIGRATION_BRIEF.md`. Reuse a maintainable, source-faithful existing renderer;
do not replace it solely to change its implementation origin.

## Shared Behavior Reuse

For each exception, decide whether the next page of the same family can reuse
its mechanism. Search maintained generators, adapters, and state machines
before adding page logic. Reuse an existing compatible contract; extract a
shared mechanism when at least two real consumers demonstrate the same
semantics. Keep genuinely special behavior local and record why. Do not build
unused abstractions to fill a capability checklist.

Candidate families include timeline/nested playback and Replay, choice
feedback/scoring/branching, drag/match rules, deterministic random selection,
audio lifecycle, and modern My Lesson interfaces. These are search directions,
not claims that a shared implementation already supports each family.

Keep source-specific choices, predicates, copy, frame destinations, geometry,
audio bindings, and evidence identities in page configuration. Share only the
mechanism proven equivalent by source evidence; preserve differences in retry
limits, counter reset, focus, timing, and host effects. Deterministic selection
is not proof of equivalence to Flash random().

A maintained example is
`packages/demos/src/timelines/practice-question-feedback.ts`, used by G4 L3
TS007 and TS008 for seed normalization, feedback selection, and two-attempt
routing. Their walkthroughs, help availability, feedback assets, and terminal
counter reset remain page-specific. This module does not implement scoring,
audio, or complete Replay; page reducers retain those responsibilities.

For a shared extraction, run existing consumer behavior tests before and after,
and test meaningful common boundaries plus the differences that must survive.
Report actual consumers and checks, not a projected page count or savings.
Keep source-bound expectations independent of the new helper. Change a
maintained generator/IR/adapter and regenerate when output is generated.

## Timeline And Asset Contract

- Define immutable native metadata and preserve the fixed Flash coordinate
  system, including the integer-scaled Canvas contract in `AGENTS.md`.
- Keep root and nested playheads separate. `runtime.frameCount` remains the
  SWF root timeline; each longer MovieClip has its own frame domain and
  source-placement/entry-state hash. Map elapsed time to one-indexed frames in
  the active domain.
- Return the complete visible and interactive state from a pure function for
  any declared frame, scenario, language, and seed. Avoid chained `setTimeout`
  choreography and mutable states that cannot be queried at an exact frame.
- Encode transforms, alpha, depth, counters, formulas, labels, buttons, audio
  cues, branches, terminal state, and Replay from evidence. Replay resets the
  complete state vector, not only a frame counter.
- Maintain tests for metadata, every key beat and boundary, all languages and
  reachable scenarios, terminal state, and Replay. For a bounded correction,
  run the affected checks and broaden for shared changes or unresolved risk.
- Expose deterministic capture parameters for every requirement identity
  field. The stage must report matching `data-flash-*` attributes. Run
  `npm run audit:renderer-frame-domains` when adding or changing explicit
  domains; DOM identity cannot substitute for matching pure renderer state.

Prefer extracted original vectors, paths, bitmaps, and font glyphs when rights
permit. Keep reusable objects editable and layered; do not flatten the lesson
into screenshots. Record every extracted, converted, redrawn, or generated
asset in `asset-inventory.csv` with source identity and transformation notes.
Change generated assets through the maintained IR, generator, or adapter and
regenerate them; never hand-edit generated output.

## Product Validation And Packaging

Register the reviewed module and assets under the exact active placement,
preserve source order in the lesson descriptor, and exercise the actual modern
My Lesson host, navigation, interaction, Replay, and audio lifecycle. A
standalone renderer alone does not establish Current-JS product integration.

For a new renderer or product integration, run the relevant unit tests and a
production build before capturing the candidate. For an existing bounded
change, select checks for the affected behavior and retain every check required
by the requested gate. Use [fidelity-validation.md](fidelity-validation.md) for
deterministic capture, comparison, responsive/keyboard accessibility, and
evidence identity. Candidate captures are Current-JS evidence only.

Keep the Next.js route, pure timeline source, deterministic capture contract,
and complete evidence workspace. Produce a standalone HTML + JavaScript
package only when requested; keep it offline-capable unless a dependency is
explicitly approved. Use [lesson-release.md](lesson-release.md) for strict
closure and publication, and [audio-and-review.md](audio-and-review.md) for
separate audio, human, and Owner decisions.
