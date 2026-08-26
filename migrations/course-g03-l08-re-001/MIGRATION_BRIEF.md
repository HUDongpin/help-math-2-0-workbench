# course-g03-l08-re-001 Migration Brief

Created: 2026-07-20
Candidate implementation and evidence disposition updated: 2026-07-23

## Objective

Provide a minimal native React/Canvas candidate for the preserved Grade 3 Lesson 8 historical Review SWF without inventing the assessment-host payload that the movie requires. The candidate renders the fixed English standalone source visual unchanged in both `en` and `es` request contexts, explicitly classifies that narrow root state as `source-shared-untranslated-visual`, models the source root and nested timeline boundaries, supplies a modern Replay control, and fails closed for every unresolved `sprite-621` review-data state, audio, navigation, scoring, and legacy side effect.

The `es` root rendering is not a Spanish translation or a Spanish original-runtime parity claim. This candidate is not a complete, one-to-one, or strict migration.

## Identity And Classification

- `assetId`: `swf-e4a6403f6b45a3b4aecb48e0659aa20113acb0644e37b027a19fb51f34417f9b`.
- `animationId`: `course-g03-l08-re-001`.
- Collection: course; Grade 3; Lesson 8; historical Review placement `RE/L8RE01.swf`.
- Lesson/domain: Measurement / `measurement-money`.
- Exact source-visible title: `Quiz Review Details for the Student:`.
- The active lesson XML does not list this historical Review placement. The source is preserved without pretending it is an active course page.
- Classification remains inferred with low confidence.

## Source Evidence

- FLA: unavailable.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L8/RE/L8RE01.swf`.
- SWF SHA-256: `e4a6403f6b45a3b4aecb48e0659aa20113acb0644e37b027a19fb51f34417f9b`.
- Scenario inventory SHA-256: `340e14373517cd77beade8e426f991fe445b7c8c6be900b18b713bcc7ca51c7a`.
- Static frame-domain disposition SHA-256: `c6d7af0ecd877b0ea24dd25af380d693bdf064e397a0f9034c762a1b4eba76ca`.
- Strict-readiness SHA-256: `c8f827436c8e7e95b7556b2e8ead065ab3c38ff28ae571b1cb52b1f4d2172e68`.
- Audio-audit SHA-256: `b69447ee9cd6098b3ab5a191d91f2e291fe78cfc6fb0ee294a269ae9070debcf`.
- Adobe standalone manifest SHA-256: `22e0feea207c14bc457489d121d6dc2f3079eee0c6f7262ac2693bb327491393`.
- Scoped renderer frame-domain audit SHA-256: `394cb9115dd2fae8943af8af3f4a3ae70abd655df9b52a8f5fa96ea9f85f23be`.
- Archived pre-disposition browser QA SHA-256: `41e66586f4b0b20cfb8f97f5a01fabe8f52f0823e6b2ac0931ce377c34f6c025`.
- Prior browser QA stale receipt SHA-256: `ed303ed3af2307ca06e084778a75d03fd6fc810f9101eed9317d5a566a7ded2b`.
- Root bilingual visual disposition SHA-256: `f9651cdd7079da0dd79742057b059001970a0bffa10bc11a5cad978e8ea62228`.
- Host-payload boundary SHA-256: `a9ae570479f1434442b676167dc7f86f0245d8451e28344c34f71c007d18ba4f`.
- The generated bilingual disposition binds the complete six-script FFDec export, scenario inventory, static disposition, all 55 archived standalone PNGs, renderer audit, module, and timeline. Every translation, audio, behavior, coverage, RMSE, accessibility-acceptance, human-review, owner-acceptance, and strict-completion effect remains `false`.
- The generated host-payload boundary re-hashes the target SWF, same-lesson `index_local.swf`, active `index.xml`, and unreferenced historical `FQ/Review/L8FQ03.swf`; re-parses the target machine evidence; and re-exports both source SWFs with pinned FFDec 26.2.1. It adds zero requirements and zero implementation frames, unlocks no renderer state, and leaves every acceptance field `false`.
- Owner-provided source remains untouched and hash-verified.

## Runtime Audit

- CWS, SWF version 6, AS1/2.
- Native stage: 800 × 600; 12 FPS; 55 root frames; 4583.333 ms declared duration.
- Background: `#b8d8f7`.
- Root label `Begin` is frame 51. Its script calls `stop(); animation.gotoAndPlay(1);`.
- The root places the source-named `animation` instance at depth 4 on frame 51. It references object 621.
- `sprite-621` has 27 structural frames: frame 1 `FirstSection`, frames 2–26 `R1`–`R25`, and an unlabeled terminal structural frame 27.
- sprite-621 frame 1 immediately calls `stop()`, parses `_parent.dtfREVIEWANS`, builds the assessment arrays, sets `reviewCount` to 1, and calls `doGetReview()`.
- The source hard-codes `totalQuestionsCount = "10"`, while the structural library contains 25 R labels. Valid REVIEWANS arrays are therefore required to establish the actual reachable subset and order.
- Previous and Next buttons clamp `reviewCount` and call `doGetReview()`. The Back button invokes `getURL("javascript:history.back()")`; this side effect is prohibited.
- Static audit found no random obligations and no audio tags, streams, start tags, exact external associations, or ActionScript audio operations.
- Seven embedded font definitions, 101 sprites, 205 editable-text definitions, 183 static-text definitions, three buttons, and six exported scripts make this a host-dependent high-complexity review movie despite its minimal standalone appearance.
- `audit/host-payload-boundary.json` proves the remaining payload boundary without filling it: the active Lesson 8 XML has no `RE` section or `L8RE01.swf` placement; active `FQ/L8FQ02.swf` and `FQ/L8FQ03.swf` are both catalogued missing; all 573 scripts re-exported from the same-lesson `index_local.swf` have zero `REVIEWANS`, `dtfREVIEWANS`, `L8RE01`, or exact target-path hits; and the root `dtfSTUDENT`/`dtfREVIEWANS` fields have no `initialText`.
- The preserved but unreferenced `FQ/Review/L8FQ03.swf` contains a structurally compatible seven-segment `REVIEWANS` builder. It is historical cross-evidence only: the exact active FQ source is missing, the Review path is not active XML, and no payload transfer into `L8RE01.swf` was observed. Basename similarity cannot authorize substitution or unlock a requirement.

## Adobe Evidence And Frame-2 Failure

- Adobe Flash Player 32.0.0.414 captured all 55 one-indexed standalone root frames at 800 × 600. Every captured frame has SHA-256 `b5ca7ce7ed2805be4b0afe8309d26f0fa215abfe35efbc4d0f96bd32db5c3183` and shows only the pale-blue stage plus the English header.
- This is authoritative for the standalone-default scenario only. It does not supply original parent values, REVIEWANS, Spanish state, scoring, interactions, audio, or Replay.
- The hash-pinned Adobe controller for local frame 2 failed closed. Its immediate seek did not survive the next monitor tick: expected local frame 2, observed frame 1. Failure evidence: `baseline/controlled-local-frame-0002-adobe-player-failed-closed.json`, SHA-256 `2036f290c26f207542dc5abfdd7bbec568c82d9fbf48406e65d69944c8a86005`.
- The failure is not a baseline and is not RMSE-eligible. It proves that frame 2 must not be represented as Adobe-validated.
- The leading engineering hypothesis is AVM1 ordering: the controller seeks frame 2 in the same load/init call stack that creates the nested instance, then the root frame-51 `gotoAndPlay(1)` and deferred sprite frame-1 initialization script settle on the following tick and overwrite the early pin. A corrected shared controller should test a two-phase settle-then-pin protocol before considering a minimally populated REVIEWANS host fixture. No controller factory was modified by this candidate.

## Rendering Decision

- Selected renderer: native React + Canvas.
- Canvas draws only two source-proven primitives: the 800 × 600 `#b8d8f7` background and the exact English standalone header.
- No SWF, Ruffle player, screenshot, remote asset, script injection, network request, dynamic execution, timer, or module-owned animation ticker is used by the renderer.
- Review questions and answer artwork are not extracted into production because their visible state depends on unresolved host arrays. Rendering a static FFDec R frame as the default would misrepresent runtime reachability.
- `root/root-standalone` renders the same fixed English source drawing in both `en` and `es`, marked `source-shared-untranslated-visual`. No translated Spanish text is supplied.
- Every `sprite-621` request remains `host-dependent-unresolved`: Spanish nested requests retain `spanish-host-state-not-source-proven`; English default/host-review requests retain `reviewans-host-state-unavailable`; and the English legacy Back request retains `javascript-history-side-effect-disabled`.

## Timeline And State Contract

- The movie contract retains the source 55-frame root domain and one-indexed capture behavior.
- Natural playback ends at frame 51, the source `Begin` stop.
- Frames 1–50: `pre-begin`; local animation not yet placed.
- Frame 51: `begin-stopped`; object 621 is placed and its proven unresolved standalone state remains local frame 1 / `FirstSection`.
- Explicit structural captures 52–55 are labeled `post-stop-structural-frame`, but their natural playback frame remains 51. They do not promote FFDec R screens to runtime truth.
- The module exposes all 27 local structural frame labels for audit, reports exact `sprite-621` request identity, and fails every local request closed; it implements none of R1–R25 as an authoritative question scenario.
- The product registry preserves the 55-frame root and separately declares `sprite-621` as 27 frames entered at root frame 51. Root accepts only `root-standalone`; `sprite-621` accepts only `default`, `host-review-unavailable`, and `legacy-back-unavailable`. Cross-domain combinations and unknown runtime requests fail closed before any visual is admitted.
- The root state reports `source-shared-untranslated-visual` for both languages. Nested states report `host-dependent-unresolved`; enabling the `es` root cannot unlock any `sprite-621` endpoint.
- `?frameDomain=`, `?requirementId=`, `?trace=`, `?entryStateSha256=`, `?frame=`, `?scenario=`, `?lang=`, and `?seed=` remain deterministic. Seed is retained but has no visual effect because no random branch exists.
- Pure source-semantics helpers preserve the exact seven `SPL` segments, map R1–R25 to local frames 2–26, clamp Previous/Next to 1–10, reproduce the legacy ordinal-comparison behavior, and return an inert Back-navigation intent. These helpers do not supply a historical REVIEWANS payload or make a local renderer state ready.
- Reduced motion freezes at the source stop frame 51.
- Modern Replay restarts the candidate at root frame 1. No source Replay parity is claimed because no unambiguous legacy Replay handler exists.

## Scenarios And Fail-Closed Behavior

- `root-standalone` on `root`: the fixed English standalone header is rendered unchanged for `en` and `es`; the `es` result is source-shared untranslated visual output, not translation or Spanish runtime authority.
- `default` on `sprite-621`: blocked because the original REVIEWANS assessment-host payload is unavailable.
- `host-review-unavailable`: explains that REVIEWANS and related arrays are missing; no question, response, score, or answer is guessed.
- `legacy-back-unavailable`: records the JavaScript-history source obligation without executing it.
- `lang=es` on `sprite-621`: remains blocked because no authoritative Spanish host payload or review visual branch is established.
- Previous, Next, and Back are visible as disabled candidate controls. The only enabled local control is modern Replay.
- Audio cues and user-triggered tracks are empty. Strict audio not-applicable review remains pending until authoritative listening covers host-bound states.

## Implementation Map

- Route: `/animations/course-g03-l08-re-001` after one-time registry integration.
- React/Canvas module: `packages/demos/src/modules/course-g03-l08-re-001.tsx`.
- Pure timeline: `packages/demos/src/timelines/course-g03-l08-re-001.ts`.
- Tests: `packages/demos/tests/course-g03-l08-re-001.test.ts`.
- Shared dynamic route: `apps/web/app/[locale]/animations/[animationId]/page.tsx`.
- Reference route: `/reference/course-g03-l08-re-001`, local forensic use only.
- Standalone package: not requested.

## Verification

- Fifteen candidate-specific tests pass for hashes, native metadata, exact source-semantics helpers, root/local timeline structure, all 16 valid endpoint identity probes, invalid domain/scenario rejection, stop behavior, visual-localization disposition, Canvas/Replay semantics, and the absence of network, dynamic execution, timers, or an ambient ticker.
- The product runtime rejects a requested frame domain unless the pure state reports that exact domain. The scoped generic renderer audit reports exact identity for 16/16 first/last probes: all four root `en`/`es` probes are renderable and the root domain is fully renderer-addressable; all 12 `sprite-621` probes remain blocked.
- The hash-bound bilingual-disposition generator and its six tests are reproducible. It records zero language-sensitive matches in the complete six-script FFDec export, one distinct PNG hash across all 55 standalone frames, no external renderer visual assets, and false values for every acceptance effect.
- A historical engineering-only capture produced all 55 English root frames at 800 × 600. Its prereview recorded normalized RMSE `0.03843325631193127`, but that metric binds superseded module, timeline, and test bytes and is not valid for the current JavaScript output.
- `evidence/root-standalone-renderer-engineering-prereview.invalidated-stale-implementation-bindings.json` formally excludes that prereview from current evidence while retaining the original artifact byte-for-byte. No current RMSE is claimed; a fresh hash-bound capture, comparison, metrics set, and review are required.
- The prior browser candidate QA report is intentionally not regenerated in this increment because capture/adoption was out of scope. Its six-case matrix and implementation hashes are stale for the new root `es` disposition. It is preserved byte-for-byte as `evidence/native-canvas-candidate-qa.pre-root-bilingual-disposition.stale.json`. `audit/prior-browser-qa-stale-disposition.json` binds that exact historical report (`41e66586f4b0b20cfb8f97f5a01fabe8f52f0823e6b2ac0931ce377c34f6c025`), proves that its producer/module/timeline/test hashes all changed, and leaves every acceptance effect false. The dedicated QA producer and test now require an eight-case matrix with two ready root cases and six blocked nested cases; a later authorized QA run may safely replace the active report without losing this archive.
- Full-frame coverage remains unchanged: 8/8 requirements are still blocked, 55/272 declared implementation frames are captured, and `req:root:root-standalone:es` still has 0/55 captured frames. No implementation capture or coverage adoption was performed.
- The historical current-JavaScript approval report is stale for this revision; no approval was migrated or inferred. A fresh named-human approval of the current hash closure is required separately from strict all-diff human review and owner acceptance.
- No strict baseline/coverage/RMSE gate, human review, owner review, or strict-validator pass is claimed.

## Exceptions And Completion

- The FLA and original assessment-host payload are unavailable.
- The active FQ page 2 and page 3 SWFs are missing. The unreferenced historical FQ Review variant is cross-evidence only and is not an authoritative payload producer for this target.
- Local frame 2 failed the current Adobe controller's three-tick requirement and remains unproved.
- R1–R25 reachability, ordering, correct/wrong feedback, score, terminal state, and original Replay remain unresolved.
- Spanish translation/parity and audio acceptance remain unresolved.
- The JavaScript-history Back action is disabled.
- Migration status remains `preserved`.
- Engineering, human visual, and owner review remain `pending`.
