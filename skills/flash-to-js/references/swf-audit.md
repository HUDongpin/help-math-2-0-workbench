# SWF And FLA Audit

Use this reference during intake and extraction. Preserve commands and outputs inside the migration workspace so another engineer can reproduce the audit.

## Contents

- Preserve and identify sources
- Inspect SWF tags and exports
- Inspect FLA authoring data safely
- Build behavior, dependency, and confidence maps

## 1. Preserve And Identify

Work from copies. Record hashes before opening authoring tools:

```bash
file source-assets/flash/Animation.fla source-assets/flash/Animation.swf
shasum -a 256 source-assets/flash/Animation.fla source-assets/flash/Animation.swf
xxd -l 16 source-assets/flash/Animation.swf
```

Valid SWF signatures begin with `FWS`, `CWS`, or `ZWS`. Do not trust the extension alone.

Test whether an FLA is a ZIP-based document without modifying it:

```bash
unzip -l source-assets/flash/Animation.fla
```

Older binary FLA files require Adobe Animate or a compatible specialist tool.

## 2. Inspect SWF Structure

When swfmill is available:

```bash
mkdir -p migrations/Animation/audit
swfmill swf2xml source-assets/flash/Animation.swf migrations/Animation/audit/movie.xml
```

Parse XML with an XML library. Extract at least:

- Header/stage rectangle and twips-to-pixels conversion.
- Frame rate, frame count, SWF version, and background color.
- `PlaceObject`, `RemoveObject`, and depth changes.
- Matrices, color transforms, alpha, masks, filters, and blend modes.
- Shape, morph, sprite, bitmap, sound, font, text, button, and script tags.
- Exported symbols, linkage names, scene/frame labels, and external references.

Do not infer visual frames only from tag order; nested sprites have independent timelines.

## 3. Export With FFDec

Use the current stable FFDec package and record its exact version. Inspect the SWF in the GUI before bulk export. Export into a migration-specific directory, never beside the originals.

Export these categories when present:

- ActionScript and P-code.
- Shapes and morph shapes, preferably SVG plus frame sequences where needed.
- Sprites/movie clips and their frame sequences.
- Images at original encoding and as decoded PNG.
- Fonts, glyphs, and text records.
- Sounds and video streams.
- Buttons, frame labels, metadata, and XML/tag dumps.

FFDec launcher and command-line switches vary by platform package. Run the installed launcher's help and save that output before scripting a bulk export. Do not copy an unverified command from an older FFDec version.

## 4. Inspect FLA Authoring Data

For legacy HELP binary FLA files, open only a byte-identical, read-only working copy under the reviewed Animate protocol. Record the named operator, source/copy hashes, Animate version, conversion warning, open method, and whether the document remained unsaved. Never save or publish a converted in-memory legacy document; doing so can alter the only authoring evidence and does not recreate the preserved shipped SWF.

When Adobe Animate is available, record:

- Animate version and document type.
- Stage dimensions, FPS, background, scenes, and total timeline length.
- Layer names, lock/visibility state, masks, guides, and folder structure.
- Library symbol types, linkage/export names, registration points, and instance names.
- Classic/shape/motion tweens and custom eases.
- Frame actions, button actions, document class, publish settings, and FlashVars.
- Embedded/device font choices and language-specific layers.
- External files and relative paths.

For a modern or nonlegacy FLA, publish a test SWF only when separately authorized and only to a disposable audit directory. Label it generated audit output, never the shipped runtime source. Never save changes back into a preserved FLA.

## 5. Build The Behavior Map

For every visible or interactive change, add a row to `keyframes.csv` with:

- One-indexed frame number and timestamp.
- Objects entering, leaving, moving, rotating, scaling, morphing, or changing alpha.
- Text, count, language, or formula changes.
- Audio cue and synchronization.
- Script or user event that causes the state.
- Baseline image path and evidence source.

Pay particular attention to overlapping boundary frames. Flash may place and remove different instances on the same frame; the final visible depth state is authoritative.

## 6. Audit Runtime Dependencies

Search scripts and metadata for:

- `loadMovie`, `Loader`, `URLRequest`, `navigateToURL`, `getURL`, sockets, and XML/JSON loads.
- Shared libraries, imported SWFs, fonts, images, audio, video, and configuration files.
- FlashVars, cookies/shared objects, LMS calls, scoring, or tracking.
- Camera, microphone, keyboard, drag/drop, and accessibility behavior.

Do not call legacy endpoints during audit. Record them, redact tokens, and design reviewed replacements.

## 7. Record Confidence

Use one of these labels per audit area:

- `verified`: directly supported by the named source and evidence type recorded for that finding.
- `inferred`: reconstructed from partial evidence with a stated rationale.
- `missing`: required evidence is unavailable.
- `not-applicable`: the feature is absent.

Static structure can verify stage metadata, tags, scripts, symbols, and declared assets; it cannot by itself verify original-runtime appearance, interaction causality, audible output, or acceptance. Lower the final fidelity claim whenever scripts, fonts, morphs, external assets, shipped SWF, or authoritative playback remain `missing`.
