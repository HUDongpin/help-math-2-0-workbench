# G4 L10 candidate-to-product bridge calibration v26

Observed 2026-08-21, Asia/Shanghai. Baseline Git HEAD: `8770c56e2e0e63645df7c209db9b575f8dea1a9c`.

## Outcome

**CONDITIONAL GO — exactly one page crossed this batch, and all four required behavior-heavy engineering gates closed before its private registration.** VB007, “Length/Width Practice,” was separately frozen as `interactive-understood` in V25 and reused its preserved workspace. It crossed maintained module → private registry → source-ordered 46-position page-only descriptor → modern My Lesson host → source-stage and companion handlers → exact audio routes → Replay → desktop/mobile QA.

No other candidate was registered. None of the remainder was relabeled `low`. The earlier “19 remaining” figure is historical; the authoritative pre-batch current census was 10, and this sole successful selection leaves exactly 9 unregistered candidates with an honest low-lane count of 0.

The cumulative private calibration is now 15/24 audited candidates and 15/46 G4 L10 lesson pages. Grade 4 engineering Current-JS coverage is 56/645 active pages. G4 L10 public course registration remains 0. Authoritative Adobe original-runtime behavior, random-state parity, behavior or visual fidelity acceptance, spoken-language and audio listening acceptance, human review, Owner acceptance, strict completion, release eligibility, and publication all remain false.

## Freeze chain

The chain remains append-only:

| Freeze | Role | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v25.json` | Immutable implementation-before freeze for the sole VB007 selection | 19,897 | `38edf57be2859a8d1255579730776eacb325aaee2e297f152f42cae305230b6e` |
| `catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v26.json` | Immutable first fifteen-page registry successor; no additional selection | 9,188 | `305c2faefbd37313916d572ba2b3bee9c060debf73a0103ffbf30e2e91a12547` |

V25 freezes VB007's source identity, five reachable page handlers, same-lesson shell random ranges, exact product-reachable audio set, timeline reachability dispositions, Replay reset vector, and host obligations before implementation. V26 registers only that frozen page. Browser QA found no defect requiring a post-QA correction successor, so neither freeze was rewritten.

## Measured yield

| Measure | Result | Meaning |
| --- | ---: | --- |
| This separately frozen batch | 1/1 = 100% | VB007 alone was attempted and reached the private modern host. |
| Cumulative deliberate attempts | 15/15 = 100% | Every separately frozen calibration attempt has crossed its declared private bridge. |
| Audited candidate pool converted | 15/24 = 62.5% | Nine audited candidates remain unregistered. |
| G4 L10 private page coverage | 15/46 = 32.61% | Fifteen source-ordered pages are private Current-JS; 31 descriptor positions remain unavailable. |
| Grade 4 engineering Current-JS pages | 56/645 | Engineering coverage increased by exactly VB007, from 55 to 56. |
| G4 L10 public course registrations | 0 | The bridge route remains private development-only. |
| New workspaces | 0 | The batch reused `migrations/course-g04-l10-vb-007`. |

The Owner-approved G3–G5 denominator remains 1,751 active lesson-page placements. Legacy course shells remain preserved evidence and are excluded from implementation and acceptance denominators.

## Why VB007 could be frozen as interactive-understood

- Exact position: global page 11/46, Important Words page 6, `VB/L10VB07.swf`.
- Source SWF: 219,913 bytes, SHA-256 `8480ad793b8f1f02caea83bea16b9fb4f2e08f573df4f4d22d6362366fe657c1`.
- Source FLA: 2,120,192 bytes, SHA-256 `943ffc9f32773a0cde3063308cad86a206e992334ca9db8a908d71d573229795`.
- Candidate manifest SHA-256: `438c2716c12c91bb0b6975365bf9bc7cdf111b57888325afa5c294dbac589610`.
- Canvas renderer SHA-256: `cc2fcdf8de2c1da29dd5c8edc88565e197371c821509a6660c59a68a2fbba3db`.
- Main domain: `sprite-204`, 130 frames; authored quiz stop frame 61; correct continuation frames 62–130.
- Reachable handlers: `Rectangle` and `Width` glossary buttons, vertical `AnsBtn1` incorrect, horizontal `AnsBtn2` correct, and `BtnClose` feedback close/reset.
- Legacy reporting remains blocked. The host records only bounded interaction ID, outcome, branch index, and branch count in memory; it stores neither raw answers nor personal data.

The structural Canvas candidate alone did not authorize registration. VB007 crossed only after the four behavior-heavy risks below became explicit, tested product contracts.

## Four independent behavior-heavy gates

### 1. Random branches

The same-lesson shell source proves `showWrongFeed` uses `random(3) + 1` and `showRightFeed` uses `random(4) + 1`. The maintained adapter binds exactly three wrong and four right feedback timelines, and its test exhausts all seven. Browser QA observed wrong/right branch 1 before Replay and branch 2 after Replay.

Wrong4 (`sprite-45`) and Right5 (`sprite-203`) remain source-present but outside the shipped host ranges. They were not silently made reachable. The deterministic seed cycle supports engineering exhaustion only; Adobe random-state sequence parity remains unaccepted.

### 2. Audio routing

The materializer emits only the nine product-reachable embedded streams, one exact main continuation covering frames 62–130, and one Spanish host track. Every output is SHA-256 bound, probed, and fully decoded to EOF. English uses embedded source audio; Spanish uses `host-es-or-muted` and requires learner activation.

- Materializer: `scripts/materialize-g4-l10-vb007-private-audio.mjs`, 17,558 bytes, SHA-256 `8d0cbc6003cb14dbeda087fa2c1e7141a02b9f3c53bdbf605eb54f1d35359f1c`.
- Browser manifest: 15,204 bytes, SHA-256 `808aacefd8b157f5e4659f0780d34f55b654a53ab2dff0c2d7629c9529a8a156`.
- Audio receipt: 15,407 bytes, SHA-256 `b2f01e75f71b8d89b07f8f489623464eeea8758e87417ce60684ab33fa83f642`.
- Exact continuation: 69 blocks, 5,747 ms, 28,600 bytes, SHA-256 `55aea0a63242d214a9b5b828347236971fc7083334da945d45e31507f2cb56b2`.

Browser request evidence returned HTTP 206 for the main cue, wrong branch 2, feedback close, right branch 2, main continuation, and Spanish host track. Technical integrity is established; listening, spoken-language, and audio acceptance remain pending.

### 3. Timeline reachability

The wrong path holds the parent Canvas at frame 61, runs one selected wrong feedback timeline, waits at its authored close point, then executes the typed close/reset contract before answers return. The correct path runs one selected right feedback timeline and then advances the parent domain with exact continuation audio from frame 62 through authored terminal frame 130.

Browser QA observed the correct path enter frame 62, then complete with product frame 130 and Canvas `data-flash-frame=130`, status `ready`. Strict unresolved `sprite-41` remains owned by the typed product popup disposition, while `sprite-181` remains product-unreachable inside Right5. The strict frame-domain artifact was not mutated, and natural Adobe runtime reachability remains unaccepted.

### 4. Replay engineering

Replay stops host narration, interactive feedback audio, continuation audio, and main timeline audio; clears branch, outcome, phase, timers, continuation state, terminal frame, and memory-only host state; and rewinds the source-static renderer.

At 150 ms after Replay, browser QA observed phase `idle`, branch `none`, product frame 3, Canvas frame 3, disabled answer handlers, and no stage handler surface. At frame 61, both authored-stage handlers and both companion handlers returned. This closes the maintained product Replay contract only; original Flash Replay parity remains unaccepted.

## Product bridge and browser QA

The private bridge now exposes exactly fifteen G4 L10 pages in source order. VB007's maintained module is 22,976 bytes, SHA-256 `270d65a6b6e9ddf75ee23df03afbdb7b7a2523358183548b9274eceb68bcdf22`; its timeline contract is 2,989 bytes, SHA-256 `c5d4de1d703f1ed582405ea704724fe98fa9daf0c4032a156b4fda21244e4e6e`.

Current bridge artifacts:

- Private registry: 3,055 bytes, SHA-256 `e20275a08fa78e8639846de73eaba3c956845f105dae47c332fab2f37ce81391`.
- Generated registry: 29,505 bytes, SHA-256 `d3fa2a497c22286a53733ff94713ad093af308c70abb95a52f967aad68d790d9`.
- Page-only descriptor: 26,342 bytes, SHA-256 `ccd4bd936d42496dbfae353fd7b59730480a7226e24c1dea8202947b7f2c55b3`.
- Generic stage-host descriptor contract: 22,138 bytes, SHA-256 `43fa019f6b07e1d546e2517ce61ae77f1cebd86ade927d381b6e184e18831f7c`.
- Modern My Lesson player: 37,803 bytes, SHA-256 `76a3b203206d8f65e7402456d23f1d83e95a4cbb5def9d89e28ff669157e0f82`.

Desktop English at 1280×900 clicked both transparent source-stage arrows, verified exact wrong feedback, opened and closed the Width glossary without losing that feedback, restored answers through `Try again`, reached Canvas frame 130 on correct, and verified Replay reset/reenable behavior. No horizontal overflow occurred.

Mobile Spanish at 390×844 kept the source Canvas fixed English while rendering Spanish product UI, requested the exact Spanish host track, verified the `Rectángulo` glossary entry, exercised the companion wrong-answer handler, and showed no horizontal overflow.

The durable browser receipt is `migrations/course-g04-l10-vb-007/evidence/private-product-browser-qa.json`, 13,897 bytes, SHA-256 `5b8bf05a0ef01db0c45dcb1802776252cb9ad3f777f0e0c9b63dc4e1e436342f`. It binds seven inspected local screenshots under `output/playwright/g4-l10-vb007-private-product-qa/`. These are engineering evidence, not human visual or Owner acceptance.

There were zero VB007 renderer/audio request failures. The development console retained the unrelated Clerk React child-key error and development-key warning, so no whole-console-clean claim is made.

## Verification

- Final focused regression: 61 passed, 0 failed. It covers the lesson host, VB007 handler/random/audio/timeline/Replay contracts, the 24-candidate census, registry boundary, modern runtime host propagation, 46-position descriptor, and Grade 4 coverage.
- Demos TypeScript and private registry currentness: passed.
- Audio materializer currentness: passed for all 13 outputs.
- Web TypeScript still fails only on the three pre-existing `.next/types` route-export contracts for `contact`, `learning-events`, and `nova`; no task-local VB007 error was observed.

Broader repository gates remain independently fail-closed:

- The pre-batch root `npm test` baseline still reports unrelated G4 L3, G5 L4, TS006, candidate-currentness, and governance drift.
- Source verification still reports 99 unrelated G5 L4 MP3 paths.
- Workbench verification still reports stale `catalog/completion-ledger.json`.

These failures prevent a whole-repository, strict-completion, release, production, or publication claim. They do not widen or erase the green, hash-bound VB007 private bridge evidence.

## Remaining candidate boundary

Exactly nine audited candidates remain unregistered:

- FQ002, FQ003
- IN006, IN008, IN009, IN011, IN013
- TI003
- VB006

Their honest low-lane count is zero. V26 authorizes no additional animation ID.

The next batch must choose exactly one of these nine, freeze it separately as `interactive-understood`, and bind every reachable handler to a real typed host contract before registration. It cannot auto-register the remainder and cannot relabel any remaining candidate `low`. For a behavior-heavy selection, random branches, audio routing, timeline reachability, and Replay engineering must each close independently for that exact page.

No engineering closure in this report confers authoritative original-runtime, behavior or visual fidelity, audio listening, human, Owner, strict-completion, release, production, or publication acceptance.
