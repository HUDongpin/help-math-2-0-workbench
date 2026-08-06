# HELP MATH Flash-to-JavaScript Instructions

These instructions apply to the whole project. Treat the original FLA/SWF files as irreplaceable source evidence and this repository as a reusable migration workbench.

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
  missing-reference, audio, lesson, and batch manifests.
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
- Preserve the native Flash coordinate system with a fixed SVG `viewBox` or fixed Canvas backing dimensions and a responsive aspect-ratio wrapper.
- Keep user-facing text inside the original object bounds at every supported viewport.

## Timeline Contract

- Store native `stage`, `fps`, `frameCount`, and `durationMs` as explicit constants.
- Treat Flash frames as one-indexed.
- Derive visible state from elapsed time or an explicit frame. Avoid chained timeout choreography.
- Put all keyframe windows, transforms, alpha values, counters, labels, and language choices in pure testable functions.
- Add a deterministic capture mode, normally `?frame=<n>`, that freezes the exact requested frame without changing normal playback.
- Ensure Replay resets state to frame 1 and restarts the same timeline.

## Fidelity Standard

A migration is acceptable only when:

- Native stage dimensions, frame rate, frame count, duration, and background are recorded and reproduced.
- Each required beat occurs on the specified frame; browser capture may differ by at most one frame only when the reason is documented.
- Text, numbers, formulas, language variants, and layering match the evidence.
- No label, control, or artwork clips or overflows at native, desktop, and mobile sizes.
- Designated static keyframes meet normalized RMSE `<= 0.05`; transition frames target `<= 0.08`. A higher value requires visual inspection, a written explanation, and owner acceptance.
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
