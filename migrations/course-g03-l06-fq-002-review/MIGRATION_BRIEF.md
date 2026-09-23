# course-g03-l06-fq-002-review Migration Brief

Created: 2026-07-20

Source disposition refreshed: 2026-07-22

## Objective

Recover the preserved Grade 3 Lesson 6 Final Quiz Review SWF as a bilingual,
interactive, deterministic Next.js animation only after the original question
selection, answers, scoring, review, audio, host handoff, reporting boundary,
and complete reset behavior are source-proven. The current implementation is a
structural engineering candidate; it is not a faithful or complete migration.

## Identity And Classification

- Immutable asset ID:
  `swf-fadffa9df169b4c3417066431f8bfbc16a923778ec17a213b21a7ba2d0a51563`
- Placement animation ID: `course-g03-l06-fq-002-review`
- Collection: course
- Grade / lesson / section / page: Grade 3 / Lesson 6 / FQ / Review L6FQ02
- Raw and display title: `L6FQ02`
- Lesson title: `Decimals & Money`
- Domain: `assessment`
- Classification: inferred from the frozen Review path. The active lesson XML
  points to a different `FQ/L6FQ02.swf` binary.
- Variant relationship: distinct Review variant, not an alias. See
  `audit/fq002-review-variant-binding.json`.

## Source Evidence

- FLA: unavailable for this SWF.
- Pilot SWF:
  `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/FQ/Review/L6FQ02.swf`
- Pilot SWF SHA-256:
  `fadffa9df169b4c3417066431f8bfbc16a923778ec17a213b21a7ba2d0a51563`
- Provenance: owner-provided frozen archive.
- Active course SWF:
  `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/FQ/L6FQ02.swf`
- Active course SWF SHA-256:
  `230abcb4302068f31589b6947eb53cb7c12f95ff87077f1b58fdb8e41928bf80`
- Active lesson XML SHA-256:
  `d4f6b7efb8de3fff2cd28bdf31a5d97e24831a3af3fd8ee3cf13b16eb8c98a50`
- Course host `indexELM.swf` SHA-256:
  `04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd`
- Missing source: the Review SWF has no paired FLA and no source-proven
  historical course XML or deployment record naming `FQ/Review/L6FQ02.swf`.
- Conflict: active XML line 164 names `FQ/L6FQ02.swf` with `Navigation="OFF"`;
  it never names the Review path. Same basename does not overcome the different
  binary hashes.
- Bilingual/path and Replay disposition:
  `audit/bilingual-replay-source-disposition.json`.

## Runtime Audit

- SWF: compressed `CWS`, version 7, ActionScript 1/2.
- Native stage: 800 × 600, background `#b8d8f7`.
- Frame rate: 12 FPS.
- Root timeline: 10 frames, 833.333 ms nominal duration.
- Root frame 1 requests `InternalPreloader` label `jump_check` and stops.
- Root frame 6 is label `Begin`, places instance `animation` from
  `sprite-1168`, stops, and runs the elapsed-time field update.
- Main nested timeline: `sprite-1168`, 82 frames, placed at root frame 6.
- `sprite-1168` source labels:
  - frame 1: `FirstSection` and initialization;
  - frames 2–32: `Q1`–`Q31`;
  - frame 34: `Review`;
  - frame 50: stop and review-start control;
  - frames 51–81: `R1`–`R31`.
- The source chooses 10 distinct questions from a pool of 31 with AVM1
  `random()`. Every question has four answer hit targets, for 124 source answer
  controls. The exact answer key and grade bands are encoded in the pure
  timeline source and covered by unit tests, but no historical random order is
  claimed.
- Grade bands: 0–3 Unsatisfactory, 4–6 Partially Proficient, 7–8 Proficient,
  9–10 Advanced.
- Three root-reachable multiframe child timelines remain unresolved in
  `audit/frame-domain-disposition.json`:
  - `sprite-212` (2 frames): `Mc_Finish`, grade/report state;
  - `sprite-256` (8 frames): question/answer audio control state;
  - `sprite-255` (2 frames): play/pause sub-control.
- Network/reporting candidates are disabled: `getURL`, quiz report dispatch,
  bookmark, close, and unload behavior must be replaced only through reviewed
  application APIs.
- Embedded audio: none.
- External audio host rule: local question frame minus one becomes `Q<n>`;
  option 1–4 becomes suffix A–D; EN uses `EA`, SP uses `SA`; the directory is
  appended below the parent of `_global.playSwfFileName`.
- Parent active-placement candidates: 53 English MP3s and 76 Spanish MP3s.
  They are incomplete for the 310 possible question/answer/language requests
  and are not exact Review associations.
- If the Review source is loaded from its preserved path, the host requests
  `FQ/Review/EA` or `FQ/Review/SA`; both directories are absent. The parent
  `FQ/EA` and `FQ/SA` files cannot be substituted without historical
  deployment provenance.
- Audit versions: FFDec 26.2.1, swfmill 0.3.6, Adobe Flash Player standalone
  32.0.0.414 for the root capture. No paired-FLA Animate audit is possible.

## Baseline

- Authority currently available: Adobe Flash Player 32.0.0.414 lossless
  deterministic-step capture of all ten standalone root frames only.
- Viewport: native 800 × 600, device scale factor 1.
- Root capture proves frame appearance, not natural parent-host entry,
  `sprite-1168` reachability, random ordering, answer behavior, score, review,
  bilingual controls, audio, reporting, or reset.
- The FFDec 82-frame Canvas export is a static drawing explorer. It can show
  mutually unreachable layers simultaneously and is not an original-runtime
  baseline.
- Required authoritative nested baseline: source-hash-bound original-runtime
  natural entry through root frame 6, with ordered actions and state
  checkpoints for the random pool, all question/answer equivalence classes,
  finish, grade, review, terminal/reporting-disabled behavior, audio controls,
  and full reload reset.

## Rendering Decision

- Current candidate: local Canvas drawing adapter for `sprite-1168`, plus
  hash-bound PNGs for the standalone root domain.
- Current renderer is suitable only for structural inspection because the
  exported FFDec drawing helper does not execute AVM1.
- Target renderer remains an explicit React/Canvas interaction state machine
  with a pure source-timed state model. Extracted text/vector assets should
  remain editable where practical.
- Ruffle is forensic only and is not the production renderer.
- Spanish remains fail-closed. The source proves SP/EN audio buttons and host
  flags, but not the historical Review placement, selected flag values, or
  exact Review audio tree.

## Timeline Specification

- `runtime.frameCount` is the ten-frame SWF root timeline.
- `sprite-1168` is a separate 82-frame nested domain placed at root frame 6.
- Current pure source facts include:
  - all 31 question labels and frames;
  - all 31 review labels and frames;
  - all 31 correct option IDs;
  - the authored ten-question draw count;
  - all four grade bands;
  - the complete pre-first-random-draw initialization vector;
  - the exact host audio filename construction.
- Source initialization resets correct, wrong, response, and review arrays;
  restores the 31-question and 31-review pools and answer key; resets quiz and
  review counters; hides result/finish; sends finish to frame 1; then calls
  `doGetRandomQuiz()` immediately.
- Source host Replay calls `loadSWFMovie()`, which unloads and reloads the child
  SWF. Resetting only a frame or counter is insufficient. The active XML has
  navigation off, and `indexELM.swf` hides its Replay control in that branch;
  the exact Review host entry remains unresolved.
- The four current coverage requirements (root/default × en/es) do not yet
  enumerate the random, answer, grade, review, report, audio-control, and reset
  obligations. No current trace is complete.

## Asset Strategy

- Preserve all original SWF/MP3/XML bytes in `source-assets` unchanged.
- Current root PNGs are exact copies of the lossless standalone capture and
  remain English/root-only evidence.
- Current Canvas asset is generated from the hash-bound FFDec
  `sprite-1168` drawing export with no timers, network primitives, dynamic
  evaluation, persistent storage, or AVM1 execution.
- Do not copy the 129 parent FQ audio candidates into public assets until the
  exact Review deployment path is proven and each promoted file is listened
  to, hashed, and synchronized.
- `asset-inventory.csv` and `audio-inventory.csv` remain incomplete pending
  those decisions.

## Implementation Map

- Next.js route: `/animations/course-g03-l06-fq-002-review`
- React component:
  `packages/demos/src/modules/course-g03-l06-fq-002-review.tsx`
- Pure timeline:
  `packages/demos/src/timelines/course-g03-l06-fq-002-review.ts`
- Unit tests:
  `packages/demos/tests/course-g03-l06-fq-002-review.test.ts`
- Reference route: `/reference/course-g03-l06-fq-002-review`
- Standalone package: not produced.
- Deterministic contract: `frameDomain`, `requirementId`, `trace`,
  `entryStateSha256`, `frame`, `scenario`, `lang`, and `seed`, with matching
  stage `data-flash-*` identity attributes.
- Current module maturity: `legacy-prototype`.

## Verification Evidence

- Focused source/timeline/renderer tests exist and validate hashes, root/local
  separation, question/answer facts, grade bands, reset vector, host audio path
  derivation, Review-path absence, renderer identity, and fail-closed Spanish.
- Root-domain PNG dimensions and hashes are revalidated in tests.
- Full-frame nested natural-trace coverage: 0 accepted requirements.
- RMSE for reachable interactive states: unavailable.
- Audio listening and synchronization: unavailable.
- Behavior QA and product QA: unavailable for strict scope.
- Human visual reviewer: none.
- Owner reviewer: none.
- Migration status remains `preserved`.

## Exceptions And Decisions

Blocking exceptions:

1. No paired FLA and no source-proven historical Review host placement.
2. Parent FQ audio belongs only to the active-placement candidate group; the
   actual Review-path `EA` and `SA` directories are absent.
3. Spanish host flags and visible audio-control states are not traversed.
4. Random 10-of-31 selection, 124 answer controls, score, grades, Review,
   report/close branches, and terminal behavior are not implemented or
   naturally captured.
5. `sprite-212`, `sprite-256`, and `sprite-255` have no final frame-domain
   disposition or renderer support.
6. Source Replay is a complete child reload, while the current button is only
   a product-host candidate reset and has no Review-specific natural proof.
7. Full-frame/RMSE, behavior QA, product QA, engineering review, human visual
   review, and owner acceptance are pending.

No exception is accepted; all listed items remain blocking.

## Completion

- Engineering reviewer: none.
- Review date: none.
- Owner review status: pending.
- Strict validator: failing by design; this migration is not complete.
