# course-g04-l03-in-009 Migration Brief

Created: 2026-07-20

## Objective

Reconstruct Grade 4 Lesson 3, Learn It page 9, “Situations with Negative Numbers:
Temperature,” while preserving the source timeline, the HELP Math course-host
contract, English/Spanish context, embedded narration, Spanish host audio,
Temperature/Measure glossary actions, terminal state, and Replay. The current
JavaScript output is an engineering candidate only; unresolved host behavior is
kept fail-closed.

## Identity And Classification

- Immutable `assetId`: `swf-766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c`
- Placement `animationId`: `course-g04-l03-in-009`
- Collection, grade, lesson, section, and page: course, Grade 4, Lesson 3,
  IN/Learn It, page 9
- Raw and display title: `Situations with Negative Numbers: Temperature`
- Knowledge point (English): `Situations with Negative Numbers: Temperature`
- Knowledge point (Spanish, preserved verbatim from owner XML):
  `Situaciones con números negativos Temperature:Temperatura`
- Controlled mathematics domain: negative numbers and number line
- Classification: confirmed from `ELMGR4/L3/index.xml` lines 77 and 84 plus
  the source path
- Alias or variant relationship: none recorded

## Source Evidence

- FLA: unavailable
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN09.swf`
- Source owner/provenance: owner-provided HELP Math archive
- SWF SHA-256: `766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c`
- Same-lesson shell: `ELMGR4/L3/index_local.swf`, SHA-256
  `817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e`
- Exact Spanish host audio: `ELMGR4/L3/SA/L3IN09.mp3`, SHA-256
  `1d2370d59a6400dbd666a3f049fd4222a54d664e62055a1fb5f93596b9a2ea4b`
- Missing source files: the authoring FLA; any original font source not embedded
  or otherwise recoverable
- Evidence conflict: the SWF root has 10 frames, while its placed main
  `sprite-200` has 637 local frames. They are represented as separate frame
  domains; the child timeline is not relabelled as the SWF root.
- Detailed localization/interaction source contract:
  `audit/owner-host-localization-interaction-contract.json`

## Runtime Audit

- SWF signature/version: CWS, SWF version 6
- Stage: 800 × 600 at 12 FPS; background `#b8d8f7`
- Root domain: 10 one-indexed frames, 833.333 ms; `begin` and the named
  `animation` placement occur on root frame 6
- Main domain: `sprite-200`, 637 one-indexed local frames, 53,083.333 ms,
  placed at root frame 6
- ActionScript: AS1/2; exactly five child script exports. Root frame 1 requests
  the parent `InternalPreloader` and stops; root frame 6 stops; buttons 67 and
  68 request `Temperature` and `Measure` through `DoHyperLinks`.
- Visual language structure: one child visual timeline, with no child-script
  language branch. The owner shell’s Spanish audio code pauses/resumes that
  same visual; this is classified as `source-shared-untranslated-visual`, not
  as translated Spanish artwork.
- Audio: one nested 22.05 kHz mono MP3 SoundStream on `sprite-200` (frames
  7–637, 48,901 ms structurally) plus one exact 48 kHz mono Spanish host MP3
  (40,344 ms, user-activated). Spoken content and synchronization have not
  been accepted by listening.
- External/legacy APIs: parent `InternalPreloader`, `DoHyperLinks`,
  `animation_mc.animation`, course globals, `gSound.loadSound`, and host
  `loadSWFMovie`. No legacy endpoint is executed by the modern candidate.
- Host intent recovered statically: Spanish audio stops the child, loads
  `SA/<child-basename>.mp3`, and conditionally resumes on completion/manual
  stop; Replay resets host/audio flags then reloads the current page; the full
  shell contains a nested-terminal stop monitor. Runtime ordering remains
  unverified.
- Audit tools: JPEXS FFDec 26.2.1, swfmill 0.3.6, ffprobe/FFmpeg 8.1.2,
  Adobe Flash Player 32.0.0.414 for the standalone root capture
- Confidence: high for hashed bytes, dimensions, frame domains, ActionScript
  text, owner XML, and file metadata; medium for statically inferred host
  intent; unresolved for natural host execution, spoken content, sync,
  interaction geometry, terminal ordering, and Replay equivalence

## Baseline

- Authoritative material currently available: untouched source SWF running in
  Adobe Flash Player 32.0.0.414 for all 10 standalone root frames
- Native viewport/device scale: 800 × 600 at device scale factor 1
- Capture method: Flash Player Control > Rewind, then one Control > Step
  Forward per one-indexed frame; lossless macOS window capture with only the
  operating-system corner alpha composited against the SWF background
- Root frames 1–10 are archived and hash-bound. A controlled frame-637 probe
  exists for engineering diagnosis of the nested renderer.
- Missing authoritative baseline: natural same-lesson shell entry, every
  `sprite-200` frame, Spanish-audio states, glossary branches, terminal state,
  and Replay trace
- Ruffle is not used as production evidence for this candidate.

## Rendering Decision

- Selected renderer: React host plus a local, deterministic Canvas drawing
  adapter generated from hash-bound FFDec output
- Reason: the 637-frame clip contains dense vector/mask/tween content for which
  preserving source display-list drawing is lower risk than manual SVG redraw
- Rejected for now: generic HTML audio controls, because they do not reproduce
  the source host’s child stop/resume and Replay behavior; direct legacy/Ruffle
  execution is also excluded from production
- Accessibility/localization: native Canvas retains a descriptive label and
  deterministic identity attributes. Unimplemented Spanish audio and glossary
  scenarios fail closed instead of presenting guessed behavior.

## Timeline Specification

- Root and `sprite-200` are distinct one-indexed domains. `sprite-200` enters
  at root frame 6 and owns the 637-frame teaching sequence.
- Declared candidate scenarios are `default`, `root-standalone`,
  `glossary-temperature-unavailable`, and `glossary-measure-unavailable`.
- English deterministic drawing is seed-independent. Spanish, both glossary
  actions, natural host entry, host terminal ordering, Spanish audio, embedded
  audio, and source-equivalent Replay remain unimplemented/unvalidated.
- Trace specifications exist for root/sprite × en/es, but a trace specification
  is not a runtime baseline or full-frame completion record.

## Asset Strategy

- Generated local Canvas asset:
  `public/flash-assets/courses/course-g04-l03-in-009/canvas-renderer.js`
- Generated-asset manifest:
  `public/flash-assets/courses/course-g04-l03-in-009/manifest.json`
- Byte-identical public Spanish MP3:
  `public/flash-assets/audio/courses/course-g04-l03-in-009/es.mp3`
- The MP3 is preserved and publicly addressable but is intentionally not wired
  to the current animation module until source-equivalent pause/resume and
  listening/synchronization evidence exist.

## Implementation Map

- Next.js route: `/animations/course-g04-l03-in-009`
- React component: `packages/demos/src/modules/course-g04-l03-in-009.tsx`
- Pure timeline module: `packages/demos/src/timelines/course-g04-l03-in-009.ts`
- Unit test: `packages/demos/tests/course-g04-l03-in-009.test.ts`
- Ruffle reference route: local reference infrastructure only; not production
- Standalone package: not requested/generated
- Deterministic query contract: `frame`, `frameDomain`, `scenario`, `lang`,
  `seed`, `requirementId`, `trace`, and `entryStateSha256`
- Stage identity includes `data-flash-frame`, `data-flash-frame-domain`,
  `data-flash-root-frame`, requirement, trace, entry-state hash, language,
  scenario, and seed; capture readiness is withheld until the local asset and
  the complete identity are present.

## Verification Evidence

- Focused unit tests cover source identity, root/nested domains, deterministic
  state, fail-closed Spanish/glossary requests, complete capture identity,
  generated-asset safety, registry exposure, and the owner-host source contract.
- Native candidate QA has passed as engineering evidence only. Any QA artifact
  whose implementation-binding hash predates later source-contract-only edits
  must be regenerated before it can be used as current evidence.
- Full-frame coverage and RMSE acceptance: incomplete; no claim made
- Replay/keyboard, mobile, console/network, Spanish audio, embedded audio, and
  interaction traversal: not yet strict-complete
- Human all-diff review and per-pilot owner acceptance: not recorded by this
  engineering brief

## Exceptions And Decisions

- FLA unavailable.
- A static source contract now resolves which Spanish MP3, glossary keys, host
  Replay intent, and terminal stop intent belong to this page. It does not
  resolve actual runtime execution.
- The current Canvas generator still treats `lang=es` as blocked. Promoting
  the source-shared untranslated visual requires an explicit reviewed generator
  change; it must not imply translated visual content.
- Embedded narration language/content, Spanish MP3 listening, synchronization,
  stop/resume ordering, hit geometry, terminal behavior, and Replay reset are
  unresolved.
- The current candidate loops `sprite-200`; the source shell contains terminal
  stop intent, but authorized runtime ordering is required before changing it.
- The Temperature and Measure owner SWFs exist but their migrations remain
  `discovered`, so no production glossary route is fabricated.
- No accepted RMSE exception, human visual acceptance, or owner exception is
  recorded here.

## Completion

- Engineering reviewer: pending
- Review date: pending
- Owner review status: not recorded in this artifact
- Owner decision: pending separate, attributable acceptance evidence
- Strict validator result: pending/failing by design while the blockers above
  remain; migration status is not advanced by this brief or the static source
  contract
