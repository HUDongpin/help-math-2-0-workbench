# shell-course-g04-l03-index-local Migration Brief

Created: 2026-07-24  
Current specification refresh: 2026-07-25

## Objective

Rebuild the Grade 4 Lesson 3 “Negative Numbers” course shell as the 40th member
of the atomic 39-page Lesson MVP. The target is a source-faithful bilingual
HTML5/JavaScript shell with the original 800×600 coordinate system, navigation,
child loading, Replay/reset, audio, accessibility, and terminal behavior.

The current implementation is deliberately narrower: it combines a
deterministic, hash-bound FFDec static inspection of all 50 root drawings with
a separately selected, acceptance-neutral audit projection of the 39 active
`index.xml` pages. Neither presentation is an original-runtime behavioral
baseline.

## Identity And Classification

- Asset ID: `swf-817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e`.
- Placement animation ID: `shell-course-g04-l03-index-local`.
- Course placement: Grade 4, Lesson 3, platform shell.
- Raw/display title: `Negative Numbers`.
- English knowledge point: `Negative Numbers`.
- Spanish lesson title: missing from the physical course XML; the candidate
  retains the English title and displays an explicit source-language fallback.
- Classification status/confidence: inferred / low, because the placement and
  XML establish lesson identity but no paired FLA or authoritative original
  runtime establishes the complete authored shell behavior.

## Source Evidence

- FLA: unavailable (`pairedFlaStatus: missing`).
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf`.
- SWF SHA-256: `817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e`.
- Course XML: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index.xml`.
- XML SHA-256: `0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0`.
- Provenance: owner-provided preserved source archive; source bytes are never
  edited by this migration.
- Conflict: static shell ActionScript lists 44 child paths, while the physical
  XML has 39 active pages. The current product projection follows the 39 active
  XML pages and leaves the conflict unresolved for original-runtime/Owner
  disposition.

## Runtime Audit

- SWF: CWS, version 6, declared uncompressed length 903,068 bytes.
- Native stage: 800×600, white background.
- Root timeline: 12 FPS, 50 frames, 4,166.667 ms.
- ActionScript: AS1/2; 327 `DoAction` and 3 `DoInitAction` tags.
- Static script export: 528 files.
- Static definition inventory: 422 shapes, 317 text definitions, 187 sprites,
  97 buttons, 23 fonts, 6 bitmaps, 4 sounds, and 1 morph definition.
- Root placement analysis reaches 89 child timelines. A hash-bound static proof
  now classifies exactly 56 one-frame, scriptless children as composite with
  their containing context; this removes only an independent local-playhead
  obligation. `sprite-1011` is declared as a separate 48-frame structural
  inspection domain. The directly placed `sprite-528` (`mover_mc`) is also
  declared as an 871-frame structural inspection domain with an exact complete
  frame lookup; its ActionScript and hover causality are not claimed. The
  directly placed control timelines `sprite-302` (`popup`, 149 frames) and
  `sprite-327` (`mouseobj`, 132 frames) now have the same source-static treatment.
  The nested `sprite-132` preloader progress timeline is also declared as a
  100-frame structural domain through the `sprite-135` placement chain.
  Twenty-eight
  timelines remain unresolved: 14 one-frame scripted or event-bearing children
  and 14 multi-frame candidates. The static high-risk candidate list is now empty,
  but every remaining disposition and all runtime causality still require
  authoritative evidence.
- Static mask candidates: two clip-depth placements; runtime use unresolved.
- External-effect candidates: `SharedObject`, `fscommand`, `getURL`,
  `loadMovie`, `loadVariablesNum`, and `Sound.loadSound`. None was executed.
- Audio inventory: 192 machine candidates. Sixteen decodable embedded MP3
  definitions/streams are now hash-inventoried as language `und` with no
  guessed cue frame. Runtime reachability, language, cues, synchronization,
  listening, implementation, and acceptance remain unresolved.
- Source scripts establish candidates for 39/44-path lesson sequencing,
  previous/next, section/page selection, Spanish audio, bookmarks, key terms,
  calculator, and close/host effects. Static scripts do not prove reachability.
- Tools: FFDec 26.2.1, swfmill 0.3.6, Ruffle npm 0.4.1 (forensic only),
  Playwright 1.61.1 with Chromium 149.0.7827.55. Adobe Animate 2021 21.0.7 is
  installed but was not opened for this SWF-only shell.

## Baseline

- Required authority: authorized original-runtime natural traces for shell
  navigation, child loading, language/audio, interactions, terminal state, and
  Replay. Ruffle may be retained only as a versioned forensic comparison.
- Reference route: `/reference/shell-course-g04-l03-index-local`.
- Native capture viewport: 800×600 at device scale 1.
- Current state: no authoritative original-runtime capture manifest or accepted
  keyframe/full-frame baseline exists. `keyframes.csv` therefore remains empty.
- `baseline/ffdec-root-frames.json` binds 50 native 800×600 static root exports
  (24 distinct PNG hashes) to the untouched SWF. This is structural evidence:
  FFDec did not execute ActionScript, child loading, audio, or interactions.

## Rendering Decision

- Current renderer: hash-bound FFDec root, `sprite-1011`, and `sprite-528` PNG
  inspection plus React semantic HTML/CSS, selected by a pure TypeScript timeline.
- `source-root-structural` displays frames 1–50 as source-shared untranslated
  structural drawings. `lesson-map-audit` and the section scenarios expose the
  safe, editable, responsive 39-page map only at frame 50.
- Rejected as production authority: Ruffle embedding, cross-lesson loader reuse,
  static screenshots/video, executing legacy endpoints, and guessed Spanish
  translations or audio cues.
- Final renderer remains open pending source visual/runtime evidence. Extracted
  vectors/bitmaps or Canvas/CreateJS may be adopted only when they preserve the
  original timeline and materially reduce fidelity risk.

## Timeline Specification

- Frames 1–48: `source-loading-static-structure`; the exact FFDec structural
  PNG is renderable with strict-acceptance effect `none`.
- Frame 49: `source-initialization-static-structure`; the static root drawing
  is renderable while natural execution of the recovered `stop()` remains
  unproven.
- Frame 50: `source-close-confirmation-static-structure`; the static root
  drawing and the separately selected current-JavaScript map are never
  presented as the same evidence.
- Current scenarios: root `source-root-structural`, nested
  `native-menu-structural`, `mover-tooltip-structural`,
  `popup-control-structural`, and `mouse-object-control-structural`,
  `preloader-progress-structural`, `lesson-map-audit`, the eight `section-*`
  views, and `quit-confirmation`;
  English and Spanish contexts use seed 0 by default.
- Current Replay resets the current JavaScript interaction state to the map.
  Complete original host/child/audio/reset parity is unverified.
- Required future source traces include natural load, each section/page route,
  previous/next boundaries, FQ visibility rules, Spanish audio pause/resume,
  Replay, key terms, calculator, close/cancel, terminal states, and bookmarks.
- Frame-domain evidence: `audit/static-frame-domain-disposition-evidence.json`
  and `audit/frame-domain-disposition.json` reproduce the exact 56 composite,
  5 declared nested, and 28 unresolved child split while keeping every
  behavior, audio, full-frame, RMSE, strict human-review, and Owner obligation
  open.

## Asset Strategy

- `public/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/`
  contains 50 byte-identical FFDec PNG copies plus a generator/source/hash-bound
  manifest. `asset-inventory.csv` records this bundle as engineering structural
  inspection only.
- `public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-1011/`
  contains 48 reproducible FFDec nested-timeline PNGs plus a source/tool/geometry
  bound manifest. The product clips the 1368×719 exporter canvas into the native
  800×600 stage using the static source placement candidate; no original-runtime
  or full-stage composition parity is claimed.
- `public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-528/`
  retains the exact 871-frame lookup while deduplicating byte-identical FFDec
  output to 100 PNGs. Its 1463×263 exporter canvas and `mover_mc` root placement
  are hash-bound static candidates; ActionScript, hover causality, natural
  playback, and full-stage parity remain unresolved.
- `public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-302/`
  and `sprite-327/` retain exact 149- and 132-frame lookup tables while
  deduplicating them to 20 and 22 source-static PNGs. Their root placements are
  bound, but mouse/hover causality and full-stage parity are not claimed.
- `public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-132/`
  contains 100 distinct progress-bar frames at 500×42. The two-hop placement
  chain is source-bound; loading-percent causality and full-stage parity are not.
- Editable source artwork extraction remains required before any pixel-fidelity
  claim; static whole-frame PNGs are not the final maintainable renderer.
- Machine inventories under `audit/machine/` remain candidate evidence and are
  not copied into acceptance-facing `asset-inventory.csv` or
  `audio-inventory.csv` without runtime disposition.
- Editable source vectors, text/glyph paths, masks, morphs, bitmaps, and audio
  will be recorded in the acceptance-facing CSVs when adopted.

## Implementation Map

- Next.js route: `/animations/shell-course-g04-l03-index-local` and Spanish
  locale counterpart.
- Route file: `apps/web/app/[locale]/animations/[animationId]/page.tsx`.
- React component: `packages/demos/src/modules/shell-course-g04-l03-index-local.tsx`.
- Pure timeline: `packages/demos/src/timelines/shell-course-g04-l03-index-local.ts`.
- Unit tests: `packages/demos/tests/course-shell-g04-l03.test.ts`.
- Registry module: `./modules/shell-course-g04-l03-index-local`.
- Ruffle reference route: `/reference/shell-course-g04-l03-index-local`.
- Standalone package: not requested or generated.
- Deterministic identity: `frameDomain`, `requirementId`, `trace`,
  `entryStateSha256`, `frame`, `scenario`, `lang`, and `seed`, mirrored through
  the required `data-flash-*` attributes.

## Verification Evidence

- Shell unit tests: 12/12 passing after root, all five nested structural domains,
  and map separation.
- Demo TypeScript and registry check: passing.
- Product QA: `reports/g4-l3-current-javascript-product-qa.json`; 82 unique
  routes, 121 visits, zero serious/critical Axe findings, zero horizontal
  overflow failures, and zero console/page/request/HTTP errors.
- Product QA limitation: it proves only the local current-JavaScript product
  layer. It is not an original-runtime baseline or a fidelity comparison.
- Native-size baseline/implementation pairings: missing.
- Full-frame RMSE/diffs: missing.
- Dr. Peter Hu's explicit approval of the 16 pilot JavaScript outputs bound at
  review time is recorded in `reports/current-javascript-output-human-approval.json`.
  That scope does not bind this subsequently changed shell domain and is
  intentionally separate from strict all-frame diff review and Owner acceptance,
  which remain pending.
- Frame-domain audit: 56/89 reachable children have a source-proven static
  composite disposition, five nested timelines have declared structural domains,
  and 28/89 remain runtime-dependent and block strict validation.

## Exceptions And Decisions

1. The 44-path static shell list conflicts with 39 active XML pages.
2. No paired FLA exists; authoring structure cannot be inspected.
3. Frames 1–50 have implemented FFDec static structural drawings, but no
   authorized original-runtime traversal or behavioral baseline.
4. Original host navigation, child loading, bookmarks, FQ visibility,
   keyterms, calculator, close effects, and Replay parity are unresolved.
5. Sixteen decodable embedded audio payloads are inventoried; reachability,
   cue frames, language, synchronization, listening, implementation, and reset
   behavior remain unresolved.
6. Spanish lesson and 24 page titles are absent from source XML; the candidate
   uses explicit English fallback rather than invented translations.
7. No baseline manifest, full-frame metrics, RMSE diff set, human visual review,
   Owner acceptance, strict completion, or publication exists.

## Completion

- Engineering reviewer: pending.
- Human visual reviewer: pending; a blanket approval cannot replace review of
  the required keyframe/full-frame diffs.
- Owner review: pending.
- Strict validator: expected to fail until all evidence and acceptance gates
  above are complete.
