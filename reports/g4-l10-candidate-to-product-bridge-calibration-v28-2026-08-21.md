# G4 L10 candidate-to-product bridge calibration v28

Observed 2026-08-21, Asia/Shanghai. Baseline Git HEAD: `8770c56e2e0e63645df7c209db9b575f8dea1a9c`.

## Outcome

**CONDITIONAL GO — exactly one page crossed this batch, and all four required behavior-heavy engineering gates closed before its private registration.** VB006, “Length/Width Practice,” was separately frozen as `interactive-understood` in V27 and reused its preserved workspace. It crossed maintained module → private registry → source-ordered 46-position page-only descriptor → modern My Lesson host → source-stage and companion handlers → exact audio routes → Replay → desktop/mobile QA.

No other candidate was registered. None of the remainder was relabeled `low`. The earlier “19 remaining” figure is historical; the authoritative pre-batch census was 9, and this sole successful selection leaves exactly 8 unregistered candidates with an honest low-lane count of 0.

The cumulative private calibration is now 16/24 audited candidates and 16/46 G4 L10 lesson pages. Grade 4 engineering Current-JS coverage is 57/645 active pages. G4 L10 public course registration remains 0. Authoritative Adobe original-runtime behavior, random-state parity, behavior or visual fidelity acceptance, spoken-language and audio listening acceptance, human review, Owner acceptance, strict completion, release eligibility, and publication all remain false.

## Freeze chain

The chain remains append-only:

| Freeze | Role | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v27.json` | Immutable implementation-before freeze for the sole VB006 selection | 22,281 | `2659f2fe21b71a4db917002bc552374412f0fed12d9263f0a058b57c4ba259e0` |
| `catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v28.json` | Immutable first sixteen-page registry successor; no additional selection | 9,256 | `7ee3e8cb50f87fcced770b0e505211013a2ef49231268749aa5ae8d47b3dc0d5` |

V27 freezes VB006's source identity, five reachable page handlers, the same-lesson shell random ranges, the exact product-reachable audio set, timeline reachability dispositions, Replay reset vector, and host obligations before implementation. V28 registers only that frozen page. Browser QA found no defect requiring a post-QA correction successor, so neither freeze was rewritten.

## Measured yield

| Measure | Result | Meaning |
| --- | ---: | --- |
| This separately frozen batch | 1/1 = 100% | VB006 alone was attempted and reached the private modern host. |
| Cumulative deliberate attempts | 16/16 = 100% | Every separately frozen calibration attempt has crossed its declared private bridge. |
| Audited candidate pool converted | 16/24 = 66.67% | Eight audited candidates remain unregistered. |
| G4 L10 private page coverage | 16/46 = 34.78% | Sixteen source-ordered pages are private Current-JS; 30 descriptor positions remain unavailable. |
| Grade 4 engineering Current-JS pages | 57/645 = 8.84% | Engineering coverage increased by exactly VB006, from 56 to 57. |
| G4 L10 public course registrations | 0 | The bridge route remains private development-only. |
| New workspaces | 0 | The batch reused `migrations/course-g04-l10-vb-006`. |

The Owner-approved G3–G5 denominator remains 1,751 active lesson-page placements. Legacy course shells remain preserved evidence and are excluded from implementation and acceptance denominators.

## Why VB006 could be frozen as interactive-understood

- Exact position: global page 10/46, Important Words page 5, `VB/L10VB06.swf`.
- Source SWF: 806,886 bytes, SHA-256 `cb9881b4c6b790e4c1b13fa99ee3457b2d5438c261811d22d431b1fc0cefdaa4`.
- Source FLA: 2,432,000 bytes, SHA-256 `2c809b81dedda337e6273197eaa29dcdd8275d16b250ed9a48837c3d1e0583e6`.
- Candidate manifest SHA-256: `1e564372595d8d2628c7967c6b7f1ccdbf04e188d7f82aebf6fcb349a8ff974c`.
- Canvas renderer SHA-256: `95bd749be5a31d68bb6ac296efb90b36d1b6784b288ab20db0db226b0867f614`.
- Main domain: `sprite-213`, 104 frames; authored quiz stop frame 62; correct continuation frames 63–104.
- Reachable handlers: `Rectangle` and `Length` glossary buttons, vertical 4 cm `AnsBtn2` incorrect, horizontal 9 cm `AnsBtn1` correct, and `BtnClose` feedback close/reset.
- Legacy reporting remains blocked. The host records only bounded interaction ID, outcome, branch index, and branch count in memory; it stores neither raw answers nor personal data.

The structural Canvas candidate alone did not authorize registration. VB006 crossed only after the four behavior-heavy risks below became explicit, tested product contracts.

## Four independent behavior-heavy gates

### 1. Random branches

The same-lesson shell source proves `showWrongFeed` uses `random(3) + 1` and `showRightFeed` uses `random(4) + 1`. The maintained adapter binds exactly three wrong and four right feedback timelines, and its test exhausts all seven. Browser QA observed wrong branch 1 before Replay, wrong branch 2 after Replay, and right branch 1 on the successful path.

Wrong4 (`sprite-73`) and Right5 (`sprite-212`) remain source-present but outside the shipped host ranges. They were not silently made reachable. The deterministic seed cycle supports engineering exhaustion only; Adobe random-state sequence parity remains unaccepted.

### 2. Audio routing

The materializer emits only the nine product-reachable full embedded streams, one exact main continuation covering frames 63–104, and one Spanish host track. Every output is SHA-256 bound, probed, and fully decoded to EOF. English uses embedded source audio; Spanish uses `host-es-or-muted` and requires learner activation.

- Materializer: `scripts/materialize-g4-l10-vb006-private-audio.mjs`, 17,344 bytes, SHA-256 `abd8c48e9cf691eb7c4e84df2e855c7a2122ac8defd44e3d57e5959e2e8dae56`.
- Browser manifest: 15,202 bytes, SHA-256 `ee53db2cfb8d315a7ce849fd8203657e6f9fb22ab68bae70483d6f02bfe7dfc6`.
- Audio receipt: 15,405 bytes, SHA-256 `8d6ec859461f7aa84c236f300fc04bae683d47a567843e28cfd75cb3f36c4c0d`.
- Exact continuation: 42 blocks, 3,500 ms, 17,420 bytes, SHA-256 `e643ab8bab5713139c7ffaf39afcfc6f8242b3a9772c5e6f8bfbc0bed1d7258f`.

The dev-server log observed exact HTTP 206 requests for the main cue, wrong branches 1 and 2, feedback close, right branch 1, main continuation, and Spanish host track. Technical integrity is established; listening, spoken-language, and audio acceptance remain pending.

### 3. Timeline reachability

The wrong path holds the parent Canvas at frame 62, runs one selected wrong feedback timeline, waits at its authored close point, then executes the typed close/reset contract before answers return. The correct path runs one selected right feedback timeline and then advances the parent domain with exact continuation audio from frame 63 through authored terminal frame 104.

Browser QA observed the correct path complete with product frame 104 and Canvas `data-flash-frame=104`, status `ready`. The three strict unresolved frame-domain dispositions were not mutated, and natural Adobe runtime reachability remains unaccepted.

### 4. Replay engineering

Replay stops host narration, interactive feedback audio, continuation audio, and main timeline audio; clears branch, outcome, phase, timers, continuation state, terminal frame, and memory-only host state; and rewinds the source-static renderer.

Browser QA invoked Replay from both the completed path and an open wrong-feedback state. The latter returned to phase `idle`, branch `none`, product frame 62, enabled answer handlers, and blocked legacy reporting. A subsequent wrong answer advanced the deterministic branch from 1 to 2. This closes the maintained product Replay contract only; original Flash Replay parity remains unaccepted.

## Product bridge and browser QA

The private bridge now exposes exactly sixteen G4 L10 pages in source order. VB006's maintained module is 23,078 bytes, SHA-256 `3fe17ce82f86634df7bafd484730fd709716a0bc10e660f28be18243f2c15115`; its timeline contract is 2,989 bytes, SHA-256 `59f523e10bc6c2a534b8d6334da3e27be319c989cf7280bdcc6468e941d41c2a`.

Current bridge artifacts:

- Private registry: 3,246 bytes, SHA-256 `f1b0475a9e0f3ca5decbe07cb9e398f4156f94c6645ccf6a3220f32d891ad935`.
- Generated registry: 29,791 bytes, SHA-256 `4bd5d55f6cb0fb2eb4fcff4198792ab8773db58f7cf969ee3e86873cb1ee277a`.
- Page-only descriptor: 26,699 bytes, SHA-256 `6fe53c34a5c95e18f09cbb160bf1a0dda32ea0ae728d8c999096efc2274da8c9`.
- Generic stage-host descriptor contract: 22,138 bytes, SHA-256 `43fa019f6b07e1d546e2517ce61ae77f1cebd86ade927d381b6e184e18831f7c`.
- Modern My Lesson player: 37,803 bytes, SHA-256 `76a3b203206d8f65e7402456d23f1d83e95a4cbb5def9d89e28ff669157e0f82`.

Desktop English at 1200×900 clicked the transparent source-stage arrows, verified exact wrong feedback, restored answers through `Try again`, reached Canvas frame 104 on correct, and verified Replay reset/branch advancement. No horizontal overflow occurred.

Mobile Spanish at 390×844 kept the source visual fixed English while rendering Spanish product UI, requested the exact Spanish host track through `host-es-or-muted`, exercised the source-stage wrong-answer handler, and reset an open wrong-feedback state through `Repetir`. No horizontal overflow occurred.

The durable browser receipt is `migrations/course-g04-l10-vb-006/evidence/private-product-browser-qa.json`, 12,278 bytes, SHA-256 `4821fd7e20f43d741d4fda611649119dfd5258781d69956a78751755e40add55`. It binds four local screenshots under `output/playwright/g4-l10-vb006-private-product-qa/`; three were independently inspected by the agent. These are engineering evidence, not human visual or Owner acceptance.

There were zero VB006 renderer/audio request failures. The development console retained the unrelated Clerk React child-key warning, development-key warning, CSP-blocked telemetry, and unused preload warnings, so no whole-console-clean claim is made.

## Verification

- Final focused regression: 55 passed, 0 failed: audio materializer 4; demos candidate/registry/VB006 13; web descriptor/player/host 38.
- Demos TypeScript and private registry currentness: passed.
- Audio materializer currentness: passed for all 13 outputs.
- The post-implementation reverse-boundary audit found none of the eight remaining IDs in the private registry, generated registry, selected descriptor list, or public prototype registry. Public G4 L10 animation registrations and public whole-lesson registrations both remain 0.
- Web TypeScript still fails only on the three pre-existing `.next/types` route-export contracts for `contact`, `learning-events`, and `nova`; no task-local VB006 error was observed.

Broader repository gates remain independently fail-closed:

- The pre-batch root `npm test` baseline still reports unrelated dirty-tree currentness and governance failures.
- Source verification still reports 99 unrelated G5 L4 MP3 paths.
- Workbench verification still reports stale `catalog/completion-ledger.json`.

These failures prevent a whole-repository, strict-completion, release, production, or publication claim. They do not widen or erase the green, hash-bound VB006 private bridge evidence.

## Remaining candidate boundary

Exactly eight audited candidates remain unregistered:

- FQ002, FQ003
- IN006, IN008, IN009, IN011, IN013
- TI003

Their honest low-lane count is zero. V28 authorizes no additional animation ID.

The next batch must choose exactly one of these eight, freeze it separately as `interactive-understood`, and bind every reachable handler to a real typed host contract before registration. It cannot auto-register the remainder and cannot relabel any remaining candidate `low`. For a behavior-heavy selection, random branches, audio routing, timeline reachability, and Replay engineering must each close independently for that exact page.

No engineering closure in this report confers authoritative original-runtime, behavior or visual fidelity, audio listening, human, Owner, strict-completion, release, production, or publication acceptance.
