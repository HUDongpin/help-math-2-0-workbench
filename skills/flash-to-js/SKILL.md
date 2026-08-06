---
name: flash-to-js
description: Audit and faithfully migrate Adobe Flash FLA/SWF educational animations into maintainable HTML5 JavaScript implementations for Next.js/React. Use when Codex must inspect legacy Flash timelines, ActionScript, symbols, fonts, audio, or external dependencies; establish Ruffle or Adobe baselines; choose SVG, Canvas, CreateJS, or PixiJS; rebuild frame-accurate interaction; perform keyframe pixel comparisons; or package a standalone browser version.
---

# Flash To JavaScript

Recover the authored behavior before choosing a renderer. Build a testable JavaScript timeline, preserve source evidence, and tie every fidelity claim to keyframe and interaction evidence.

## Initialize

1. Read the project-root `AGENTS.md` and `docs/TOOLING.md`.
2. Run `npm run doctor` and record unavailable forensic tools.
3. Create a work package:

```bash
npm run scaffold:migration -- <animation-id> --fla <fla-path> --swf <swf-path>
```

4. Validate its draft structure:

```bash
node skills/flash-to-js/scripts/validate_migration.mjs migrations/<animation-id> --allow-draft
```

Do not edit the files under `source-assets/`.

## Select The Evidence Path

- With FLA and SWF, inspect both. Treat the FLA as authoring structure and the SWF as shipped runtime behavior.
- With SWF only, extract metadata, scripts, and assets with FFDec and/or swfmill. Mark names or authoring structure as inferred.
- With FLA only, publish an untouched test SWF in Adobe Animate when authorized. Record the Animate version and publish settings.
- With neither executable source nor runtime capture, reconstruct from screenshots only after labeling the result as an approximation.
- If Ruffle and Adobe/original playback differ, preserve both captures and resolve the discrepancy from FLA/SWF evidence. Do not silently choose the easier rendering.

Read `references/swf-audit.md` before running extraction commands.

## Audit Before Rendering

Record these fields in `migration.json`, `asset-inventory.csv`, and `MIGRATION_BRIEF.md`:

- SHA-256 hashes and provenance of every FLA/SWF.
- SWF signature, version, compression, stage rectangle, background, FPS, frame count, and duration.
- ActionScript generation and every frame/button/document script.
- Symbols, instance names, depth order, masks, blend modes, filters, morph shapes, color transforms, and matrix transforms.
- Embedded and device fonts, glyph coverage, text bounds, localization flags, and exact strings.
- Bitmaps, vector shapes, audio, video, loaders, URLs, FlashVars, shared libraries, and missing external files.
- Every stop, goto, Replay, drag, click, keyboard, scoring, or state transition.

Stop and report reduced confidence if a required source, font, script, or dependency cannot be recovered.

## Establish The Baseline

1. Host the untouched SWF on a dedicated Ruffle reference route.
2. Record Ruffle version, renderer, viewport, device scale factor, and autoplay configuration.
3. Capture the native stage at frame 1, each object entrance/exit, transform start/end, text/count change, interaction state, final formula, and Replay state.
4. Add each required frame and expected behavior to `keyframes.csv`.
5. Preserve reference images under `migrations/<id>/baseline/keyframes/`.

Prefer an Adobe Animate test movie or authorized original-runtime recording for features Ruffle does not reproduce. Never use the rewrite itself as its own baseline.

## Choose The Renderer

- Choose React + SVG for diagrams, formulas, labels, moderate object counts, editable vectors, and accessible controls.
- Choose Canvas/CreateJS for timeline-heavy content that Adobe Animate can export reliably and that does not need DOM-level semantics.
- Choose Canvas with PixiJS for many sprites, masks, filters, or performance-sensitive raster scenes.
- Keep Ruffle only as a reference or explicitly approved temporary fallback.
- Reject video for any lesson requiring interaction, localization, dynamic state, or accessible controls.

Document the choice and rejected alternatives in `MIGRATION_BRIEF.md`.

## Build The Timeline

1. Define immutable native movie metadata.
2. Map elapsed milliseconds to one-indexed Flash frames.
3. Return complete visible state from a pure function for any frame.
4. Encode transforms, alpha, depth, counters, text, language, and button state from evidence.
5. Add unit tests for metadata, every key beat, boundary/overlap frames, language variants, completion, and Replay.
6. Add a deterministic `?frame=<n>` capture mode that freezes playback at the requested frame.

Use `lib/conversionTimeline.js` and `lib/conversionTimeline.test.mjs` as worked examples. Avoid a chain of `setTimeout` calls or state mutations that cannot be queried at an exact frame.

## Rebuild Assets

- Prefer extracted original vectors, paths, bitmaps, and font glyphs when rights permit.
- Keep reusable objects on separate layers; do not flatten the whole animation into screenshots.
- Preserve native matrices and color transforms when they carry the motion.
- Convert embedded legacy font glyphs to SVG paths when exact typography is required and the font cannot be distributed.
- Record every generated or manually redrawn asset in `asset-inventory.csv` with source IDs and transformation notes.

## Validate Fidelity

1. Run unit tests and a production build.
2. Start the application and capture exact implementation frames:

```bash
npm run capture:keyframes -- --url http://127.0.0.1:3000/<route> --frames 1,10,25,50,100 --output migrations/<id>/evidence/implementation
```

3. Compare every required pair:

```bash
npm run compare:frames -- baseline.png implementation.png --diff difference.png --max-rmse 0.05
```

4. Inspect both the metric and the diff image. Fix spatial shifts, wrong layers, missing glyphs, alpha changes, clipping, and timing errors.
5. Test the native stage plus desktop and mobile viewports. Check Replay by mouse, Enter, and Space; reduced motion; console errors; and failed network requests.

Read `references/fidelity-validation.md` for thresholds and evidence naming.

## Package And Close

- Keep the Next.js route and pure timeline source.
- Produce a standalone HTML + JavaScript package when stakeholders need a file they can open or forward.
- Do not make a standalone package depend on localhost, a CDN, or the original SWF unless explicitly documented.
- Complete every item in `ACCEPTANCE_CHECKLIST.md`.
- Run the strict validator:

```bash
node skills/flash-to-js/scripts/validate_migration.mjs migrations/<animation-id>
```

- Report source hashes, tool versions, routes, keyframes, RMSE values, test/build results, package path, and unresolved exceptions.

Do not call a migration one-to-one, faithful, or complete when the strict validator or required visual evidence is missing.
