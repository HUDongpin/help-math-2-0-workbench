---
name: flash-to-js
description: Audit and faithfully migrate Adobe Flash FLA/SWF educational content into maintainable HTML5 JavaScript for Next.js/React. Use for catalog-backed source intake, FLA/SWF/ActionScript/timeline/audio audits, compiler-assisted migration-factory calibration and scale-out, Current-JS registration and modern My Lesson integration, public-tool provenance and licensing boundaries, Ruffle forensic references, authorized original-runtime trace and full-frame evidence, SVG/Canvas/CreateJS/PixiJS renderer selection, deterministic frame-domain reconstruction, bilingual and audio validation, immutable human and owner review, strict completion ledgers, and atomic lesson release.
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

## Initialize

1. Read the project-root `AGENTS.md`, `PROJECT_MEMORY.md`, `documentation/session-memory-export-2026-07-25/INDEX.md`, `README.md`, and `docs/TOOLING.md`.
2. Run `npm run doctor`, `npm run verify:workbench`, `npm run verify:sources`, and `npm test` before editing. Record unavailable tools and any pre-existing failure.
3. Confirm the destination volume is writable and has safe free capacity before generating large full-frame evidence.
4. Resolve the catalog identity and source placement before scaffolding. Read [source-intake.md](references/source-intake.md).
5. Resolve whether `migrations/<animation-id>/` already exists. Reuse and draft-validate the canonical workspace when present; never scaffold a second workspace from a filename alias. Only create a work package when the canonical placement has no workspace:

```bash
npm run scaffold:migration -- <animation-id> --fla <fla-path> --swf <swf-path>
node skills/flash-to-js/scripts/validate_migration.mjs migrations/<animation-id> --allow-draft
```

For an existing workspace, run only the draft validator command against its canonical path before continuing.

Do not modify or overwrite preserved files under `source-assets/` or external legacy archives. Promote a reviewed new source only through the hash-bound, rollback-safe intake boundary in [source-intake.md](references/source-intake.md); never copy it ad hoc.

## Select The Evidence Path

- With FLA and shipped SWF, inspect both. Use the FLA for authoring structure and the SWF for shipped runtime behavior.
- With SWF only, extract metadata, scripts, and assets with FFDec and/or swfmill. Mark inferred authoring names and structure as inferred.
- With FLA only, treat it as authoring evidence. For legacy HELP FLA files, inspect a byte-identical read-only working copy and never save or publish a converted in-memory document. Without the preserved shipped SWF, keep strict fidelity blocked.
- With screenshots or notes only, label the result an approximation and do not claim parity.
- Keep a Ruffle route when useful for observation, but resolve disagreements from FLA/SWF structure and authorized original-runtime evidence.

Read [swf-audit.md](references/swf-audit.md) before extraction or Animate inspection.

## Calibrate A Migration Factory Before Scale-Out

Treat FFDec, swfmill, FFmpeg, Playwright, and similar public tools as a compiler-assisted front end and evidence generator, not as a universal one-click converter to maintainable native JavaScript. Structural export, callable Canvas output, P-code classification, audio decode, and smoke captures remain state 1 or 2 until the product-registration contract is satisfied.

Before lesson-wide or multi-lesson generation, complete a representative product vertical slice across every applicable complexity lane. Route each selected page through source-bound extraction, a compact versioned IR or configuration, a maintainable module or shared adapter, the official registry, the source-ordered lesson descriptor, the private modern My Lesson host, Replay/interaction/audio lifecycle, and desktop/mobile browser QA. Do not authorize engineering scale-out from structural throughput alone.

Read [factory-scaleout.md](references/factory-scaleout.md) before designing, running, measuring, or expanding a compiler-assisted Flash-to-JavaScript factory. Keep the original-runtime, fidelity, audio, human, owner, strict-completion, and publication rules in their existing references fully in force.

## Audit And Specify Before Rendering

Complete `migration.json`, `asset-inventory.csv`, `audio-inventory.csv`, `keyframes.csv`, `evidence/full-frame-coverage.json`, and `MIGRATION_BRIEF.md` before implementing the renderer.

Record at least:

- Exact source paths, SHA-256 hashes, provenance, placement `animationId`, immutable `assetId = swf-<full-sha256>`, and alias/variant relationships.
- SWF signature/version, native stage, background, FPS, root frame count, duration, and ActionScript generation.
- Every reachable root and nested timeline, placement/entry state, script, label, stop, navigation action, button, keyboard path, score, branch, terminal state, and Replay behavior.
- Symbols, instances, depth, transforms, masks, morphs, filters, blend modes, fonts, glyphs, exact strings, localization, bitmaps, audio, video, and external dependencies.
- Each reachable scenario, language, deterministic seed, trace, and source-evidenced event schedule.
- Every audio cue's source hash, language, duration, start/stop semantics, synchronization, host dependency, and Replay behavior.

Enumerate every root-reachable timeline in `audit/frame-domain-disposition.json`. An unresolved disposition, missing source, font, script, runtime path, or dependency blocks strict acceptance; report it instead of inventing evidence.

## Define Requirements And Trace Authority

Keep `runtime.frameCount` equal to the SWF root timeline. Give each longer nested MovieClip its own frame domain and bind its source placement and entry-state SHA-256.

For every coverage-v2 requirement, bind `frameDomain`, `requirementId`, `trace`, `entryStateSha256`, `scenario`, `lang`, `seed`, native stage, and exact one-indexed frame range.

- A linear root-only visual requirement may use authorized original-runtime direct seek or Rewind plus sequential Step Forward.
- A nested, interactive, branching, scoring, navigation, Replay, randomized, or source-driven requirement needs a source-evidenced natural trace and execution proof.
- Frame positioning proves only the requested visual frame. It does not prove interaction causality, terminal behavior, Replay, or audio.
- The JavaScript implementation, a Ruffle capture, a capture-kit template, a trace specification, or a prepared candidate package cannot serve as its own authoritative baseline.

Read [original-runtime-evidence.md](references/original-runtime-evidence.md) before any original-runtime session. For project pilot operations, also follow `docs/PILOT_ACCEPTANCE_RUNBOOK.md` and any requirement-specific protocol.

## Choose The Renderer

- Use React + SVG for diagrams, formulas, labels, moderate object counts, editable vectors, and accessible controls.
- Use Canvas/CreateJS for timeline-heavy content when its display-list model materially reduces risk.
- Use Canvas with PixiJS for dense sprites, masks, filters, or performance-sensitive raster work.
- Use CSS only for layout and small presentation transitions, not as the timeline source of truth.
- Reject video for required interaction, localization, dynamic state, or accessible controls.
- Keep Ruffle only as a forensic reference or an explicitly approved temporary compatibility fallback.

Document the decision and rejected alternatives in `MIGRATION_BRIEF.md`.

## Build The Timeline And Assets

1. Define immutable native metadata and preserve the fixed Flash coordinate system.
2. Keep root and nested playheads separate. Map elapsed time to one-indexed frames in the active domain.
3. Return the complete visible and interactive state from a pure function for any declared frame, scenario, language, and seed.
4. Encode transforms, alpha, depth, counters, formulas, labels, buttons, audio cues, branches, terminal state, and Replay from evidence.
5. Make Replay reset the complete state vector, not only a frame counter.
6. Add tests for metadata, every key beat and boundary, all languages and reachable scenarios, terminal state, and Replay.
7. Expose deterministic capture parameters for every requirement identity field. The stage must report matching `data-flash-*` attributes.
8. Run `npm run audit:renderer-frame-domains` for explicit domains; DOM identity cannot substitute for a matching pure renderer state.

Prefer extracted original vectors, paths, bitmaps, and font glyphs when rights permit. Keep reusable objects editable and layered; do not flatten the lesson into screenshots. Record every extracted, converted, redrawn, or generated asset in `asset-inventory.csv` with source identity and transformation notes.

Avoid chained `setTimeout` choreography and mutable states that cannot be queried at an exact frame.

## Validate Current JavaScript And Fidelity

Run unit tests and a production build. Then capture the deterministic JavaScript candidate:

```bash
npm run capture:coverage-v2 -- \
  --id <animation-id> \
  --base-url http://127.0.0.1:3000
```

This produces current-JS evidence only. It does not edit coverage, adoption, approval, review, status, or ledger files, and it does not create original-runtime authority or acceptance. Move candidate captures into reviewed evidence only through the applicable fail-closed adopter.

Use `npm run capture:keyframes -- --help` for targeted debugging and teaching-beat review. Keyframes are spot checks, not strict full-domain coverage.

Pair complete original-runtime and implementation manifests with full-frame comparison:

```bash
npm run compare:full-frames -- \
  --id <animation-id> \
  --baseline <authoritative-baseline-directory> \
  --implementation <implementation-directory> \
  --requirement-id <requirement-id> \
  --frame-domain <domain-id> \
  --trace <trace-id> \
  --entry-state-sha256 <sha256> \
  --baseline-authority <authority> \
  --baseline-manifest <baseline-manifest.json> \
  --implementation-manifest <implementation-manifest.json>
```

Inspect every diff, not only aggregate RMSE. Default review gates are `<= 0.05` for designated static frames and `<= 0.08` for transitions; a wrong formula, number, label, layer, or event fails regardless of the aggregate metric.

Test native, desktop, tablet, and mobile layouts; mouse/Enter/Space; focus and accessible names; reduced motion; localization; text overflow; console errors; asset failures; and unexpected network calls.

Read [fidelity-validation.md](references/fidelity-validation.md) for capture identity, complete-frame manifests, thresholds, and evidence naming.

## Validate Audio And Human Decisions

Structural audio extraction and machine audits cannot prove audible correctness. When audio is required, use hash-bound original-runtime listening sessions and the project system of record. When audio is not required, retain source-bound negative evidence.

Automation, Codex, scripts, and CI may prepare evidence and unsigned templates, but must never invent a reviewer, sign, backdate, or overwrite an immutable decision. Human visual and owner review are separate decisions with separate records.

Read [audio-and-review.md](references/audio-and-review.md) before preparing audio, human, or owner acceptance.

## Package, Close, And Release

- Keep the Next.js route, pure timeline source, deterministic capture contract, and complete evidence workspace.
- Produce a standalone HTML + JavaScript package only when requested; keep it offline-capable unless a dependency is explicitly approved.
- Complete `ACCEPTANCE_CHECKLIST.md` and run the strict validator:

```bash
node skills/flash-to-js/scripts/validate_migration.mjs migrations/<animation-id>
```

- Rebuild and check the completion and lesson-release ledgers. Never edit generated ledgers by hand.
- Treat an eligible atomic lesson-release ledger entry as the technical witness
  for that exact strict-complete page-placement set, not as publication
  authority. Publish only through the externally anchored production-trust
  path required by [lesson-release.md](references/lesson-release.md). Under the
  2026-08-16 Owner decision in `AGENTS.md`, the
  legacy Flash course-shell SWF remains source evidence but is not a migration
  or release member; the modern My Lesson host is validated as product
  integration rather than recreated as a Flash animation.

Read [lesson-release.md](references/lesson-release.md) before changing product visibility or publication state.

## Report The Result

Report exact files changed, animation and asset IDs, source paths and hashes, stage/FPS/root and nested frame domains, implementation route, standalone package, test/build results, implementation and original-runtime capture status, full-frame metrics, audio status, accessibility checks, human and owner record status, ledger/release status, and every unresolved exception.

For factory work, also report the operational funnel and measured candidate-to-product costs defined in [factory-scaleout.md](references/factory-scaleout.md). Never use structural compiler coverage or generated-candidate count as the registered Current-JS count.

Do not call a migration one-to-one, faithful, complete, accepted, or published unless the corresponding evidence state above is actually satisfied.
