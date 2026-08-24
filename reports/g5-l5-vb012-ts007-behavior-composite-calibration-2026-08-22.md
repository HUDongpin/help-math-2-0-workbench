# G5 L5 VB012 / TS007 behavior-composite calibration and final scale decision

Date: 2026-08-22  
Branch observed at evidence freeze: `codex/help-math-learning-platform-nova-fq`  
HEAD observed at evidence freeze: `93fb79aa16e68d32edb43b864a1c8972d59b219f`  
Scope: exactly two active Grade 5 Lesson 5 page animations, plus read-only/regression smoke on the existing four-page slice  
Legacy Flash course shell: excluded from every denominator  
Acceptance effect: none; this is private Current-JS engineering evidence, not a deployment or an Owner/release receipt

## Outcome first

The accepted bounded next step is complete.

`course-g05-l05-vb-012` and `course-g05-l05-ts-007` now have deterministic, source-bound, versioned behavior-composite IRs and generated Canvas runtimes. The exact composites are integrated into the retained modern My Lesson host, reject unknown contracts/states/frame pairings, and pass source-mutation, product-state, keyboard, Replay, bilingual-layout, responsive-layout, local production-build, local production-server, source-freeze, and workbench checks.

The calibration also found and closed a separate formal-route defect: G5 L5 already had a 56/56 descriptor, but was missing from the canonical page-only product-release registry and the server navigation descriptor list. A stale `.next` cache initially masked that gap. A clean build exposed the route as 404. The new deterministic release builder now binds all 56 active source-ordered pages, zero legacy shells, and the G5 L5 descriptor into the formal route. Clean local production-mode requests return HTTP 200 for both English and Spanish.

Final factory decision:

- **CONDITIONAL GO** for one controlled, source-family-allowlisted mini-batch.
- **NO-GO** for unattended, lesson-wide, Grade 5-wide, or arbitrary-behavior factory scale-out.
- **NO-GO** for learner release or publication. Audio, accessible mathematics, authoritative original-runtime/full-frame fidelity, human visual review, Owner acceptance, strict completion, deployment, and publication remain independently closed.

This is intentionally narrower than a general scale-out approval. The evidence supports reuse only where the parser recognizes an already calibrated source-behavior family and fails closed on everything else.

## Exact page scope

| Page | Active placement | Source pair | Calibrated behavior |
| --- | --- | --- | --- |
| `course-g05-l05-vb-012` | Lesson position 15; VB position 11 | `L5VB12.fla` + `L5VB12.swf` | Two-choice opposites question, first/second wrong consequences, correct completion, Replay |
| `course-g05-l05-ts-007` | Lesson position 52; TS position 6 | `L5TS07.fla` + `L5TS07.swf` | Five source stops, two explanation reveals, help lock, four-choice feedback, completion, Replay |

The deterministic builder reports `calibratedPageCount: 2` and `otherG5L5PagesStarted: 0`. Existing FQ003 and RW003 artifacts were exercised only as regression controls. No new G5 lesson was started.

## Canonical source and generated identity

| Page | Canonical FLA SHA-256 | Canonical SWF SHA-256 | Composite contract | Exact states | IR fingerprint | Runtime SHA-256 | Manifest SHA-256 |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| VB012 | `b9c77de0d000e2bbdfad80c11e3bcd966cf6a5026917d47feab5c9b713bb232c` | `9530d6f3adb0ed6a3c8fbb5ba22c8084e2f8a20b45a735381574eb78e714abd0` | `g5-l5-vb012-source-behavior-composite-v1` | 7 | `03299864518881a8f84892b3a0f2c4ee84c6e8518a5abed34a65d02c87606afa` | `976d2fa7eedc03d0ef618342b20ef7872b522d2b0815e4824f83c8e94fb71e14` | `7930532d097a3d73c11c52b3df10a97a0073c405e0070330303e5202e1b2e477` |
| TS007 | `2d4d3980629712f081afaa332e8b08d91fa4868d338533768408140e84b23336` | `e034c05612a1ff93223b4d3071f56b41204518b0cf9d7a4b436323e79b18a588` | `g5-l5-ts007-source-behavior-composite-v1` | 13 | `bbaf0868c833902f72477b4c8b4b848decc014aacd386ed320d95b1851de50ff` | `6cd340026e8ab4641932a5fad24f8cfded6ecf7e541783e868504add816afc72` | `55d6a098ee6ab3b95c1604dc1cd90863bd85af8d30214ae739fd30893b829bbe` |

Both IRs use `ffdec-avm1-plus-swfmill-static-assignments-v1`. AVM1 is not executed. Unknown source assignments, composite contracts, state IDs, drawing functions, or state/frame pairs fail closed. Both pages have zero compiled dynamic-text fields. Audio is deliberately disabled pending original-runtime traversal, cue/synchronization ownership, listening review, and audio acceptance.

The IR artifact file hashes are different from the IR fingerprints above because the fingerprint binds the normalized source contract embedded in the artifact:

- VB012 IR file SHA-256: `287dcd2d864f6101ce0abda24710ccc88bb75d6ae374b1531919a09ad7186eaf`
- TS007 IR file SHA-256: `401c39e3b413bf5f5a6a774939964aa23e1066a6bc91f08c11e6219f05738376`

## Exact state contracts

VB012 exposes only these states:

```text
intro
question-idle
question-wrong-attempt1
question-retry-attempt1
question-correct
question-wrong-attempt2
complete
```

The source-bound timeline is sprite 234 with 196 frames. The question stop is frame 81 and completion is frame 196. Option 2 (`+8`) is correct. The second wrong consequence exposes the source click-through and advances the source timer consequence; no generalized guessing or source behavior is invented.

TS007 exposes only these states:

```text
section-1
section-2-stop
section-3-idle
section-3-explanation
section-4-idle
section-4-explanation
question-idle
question-help-open
question-wrong-attempt1
question-retry-attempt1
question-wrong-attempt2
question-correct
complete
```

The source-bound timeline is sprite 439 with stops at frames 245, 384, 510, 628, and 671; continuation begins at 672 and completion is frame 690. The explanation boxes and help popup are enabled only in the exact source states. Option 2 is correct. A correct first response proceeds through the source right-feedback completion path; it does not require two attempts.

The typed modern My Lesson companion owns the bounded controls and feedback text. That does not establish natural feedback-clip playback or Flash-runtime parity.

## Product integration and formal-route repair

The product bridge now distinguishes all four representative lanes:

| Page | Product visual disposition |
| --- | --- |
| RW003 | `not-established`; ordinary source-static render only |
| VB012 | `source-script-behavior-composite-generated-original-runtime-unvalidated` |
| TS007 | `source-script-behavior-composite-generated-original-runtime-unvalidated` |
| FQ003 | `source-script-assignment-composite-generated-original-runtime-unvalidated` |

The retained modern My Lesson host displays an English/Spanish learner-visible engineering disclosure for VB012 and TS007. It explicitly says that AVM1 execution, natural source feedback animation, audio, original-runtime fidelity, human review, and Owner acceptance are not established.

The clean-route fix adds:

1. a deterministic G5 L5 page-only release builder;
2. a formal release-registry entry with release order 6, 56 active pages, 56 unique animations, and zero shells;
3. the G5 L5 descriptor in the server navigation descriptor set;
4. a cross-binding test from the formal release entry to the 56-page descriptor and route.

`node scripts/build-g5-l5-page-only-product-release.mjs --check` reports `PASS`, 56 active pages, 56 unique animations, zero course shells, and `acceptanceEffectsChanged: false`. The modern My Lesson host remains retained. The registry entry does not itself mean external deployment, learner release, Owner approval, or publication.

## Automated verification

| Check | Current result |
| --- | --- |
| VB012/TS007 deterministic builder and mutation/runtime suite | 6/6 PASS |
| FQ003 builder regression suite | 4/4 PASS |
| Combined builder suites | 10/10 PASS |
| Four-page product state, descriptor, route, and player tests | 13/13 PASS |
| `@helpmath/demos` registry check + TypeScript | PASS |
| `@helpmath/web` TypeScript | PASS |
| G5 L5 release builder `--check` | PASS: 56/56, zero shells, no acceptance effect |
| Webpack local production build | PASS: compile, TypeScript, 28/28 static pages, build traces |
| English local production-mode route | HTTP 200 |
| Spanish local production-mode route | HTTP 200 |
| `npm run verify:sources` | PASS: 9,313 files; 3,308,484,004 bytes; read-only enforced; zero writable entries |
| Source-manifest SHA-256 | `f4de727e98372ca550b9f87220305c8b4d5b226b26e06573ae4ca7c7d40b9549` |
| `npm run verify:workbench` | PASS: validator 3.1.0 draft, 7 preserved sources, current ledgers, 32 required artifacts |
| `npm run doctor` | PASS: 0 failures, 0 warnings |
| Web ESLint | PASS: 0 errors; 2 pre-existing unused-parameter warnings in `apps/web/lib/tutor-integration.ts` |
| `git diff --check` | PASS |

The broad root and cross-grade suites are not claimed as green. The shared dirty checkout contains unrelated, concurrently changing Grade 4/Grade 5 catalog and descriptor evidence, including stale cross-grade count/source-text assertions. This calibration did not rewrite unrelated evidence simply to make a broad suite pass. The targeted source, compiler, product, route, type, build, browser, source-freeze, and workbench surfaces above are the acceptance surface for this bounded decision.

## Real-browser local production-mode QA

The clean Webpack build was served with the modern wide shell and the G5 L5 private showcase enabled at `127.0.0.1:3221`. This is production-mode local QA, not a deployed production-environment verification.

### VB012

- Exact DOM contract: `g5-l5-vb012-source-behavior-composite-v1`.
- Exact product disposition: `source-script-behavior-composite-generated-original-runtime-unvalidated`.
- Mouse path: question idle → first wrong → Continue/retry → correct → Continue/complete → Replay.
- Keyboard path: focus `+8` and activate with Space → `question-correct`.
- Replay returns through `intro` and then reaches `question-idle`.
- The audio control remains disabled with the explicit cue/synchronization boundary.

### TS007

- Exact DOM contract: `g5-l5-ts007-source-behavior-composite-v1`.
- Production path: section 1 → section 2 stop → section 3 idle/explanation → section 4 idle/explanation → question idle → help open/close → first wrong → retry → correct → complete → Replay to section 1.
- Separate browser evidence covers the second-wrong state and correct-first keyboard path.
- Opening help disables all four answer choices until the help dialog is closed.
- The audio control remains disabled; the source records 12 embedded streams, but ownership, synchronization, listening, and acceptance are not inferred from that count.

### Four-page isolation smoke

- FQ003 resolved to `g5-l5-fq003-source-behavior-composite-v1`, advanced from `question-n1` to `question-n2`, and retained `data-legacy-reporting="blocked-memory-only"`.
- RW003 rendered through the ordinary Canvas path with no composite Canvas contract; its product disposition remained `not-established`.
- The current request ledger contained only GET requests. The TS007 runtime loaded with HTTP 200. No legacy `getURL` or quiz-report destination was observed.
- The only console errors were the expected local-only Vercel Analytics `/_vercel/insights/script.js` 404 and MIME refusal. No animation runtime exception or failed animation asset request appeared.

### Locale and responsive matrix

| Viewport | Route/locale | Canvas display size | Horizontal overflow | Result |
| --- | --- | ---: | --- | --- |
| Desktop `1200×900` | English and Spanish | `708×531` on TS007 | none | PASS |
| Tablet `1024×768` | Spanish TS007 | `661×495.75` | none | PASS |
| Mobile `390×844` | Spanish TS007 | `374×280.5` | none | PASS |

The smallest enabled control measured 44 CSS pixels in the local production layout. English/Spanish product chrome is localized. Where the source has no Spanish title or visual, the Spanish route preserves the English source content and visibly discloses that fallback. This is not Spanish Flash visual/audio fidelity acceptance.

## Screenshot evidence

The full browser evidence directory is:

`output/playwright/g5-l5-vb012-ts007-behavior-composite-2026-08-22`

Key production-mode captures:

| Screenshot | SHA-256 |
| --- | --- |
| `prod-en-desktop-vb012-correct.png` | `16766a47118fd8a09352fe98e13391e54af125671efced525465d0725b43b3f9` |
| `prod-es-mobile-ts007-section-1.png` | `58e01954312b73df4b910c30b26e41c1bca8f7e3c1f2988d68da0b71ea0e0a61` |

Additional captured states include VB012 idle, second wrong, complete, and keyboard-correct; TS007 section 1, section 3 explanation, help-open, second-wrong, and keyboard-correct-first; plus English/Spanish desktop, tablet, and mobile pages.

## Gate accounting

| Gate | Final status | Evidence-scoped meaning |
| --- | --- | --- |
| Page-only source identity | PASS | Exact canonical paired FLA/SWF hashes for both selected pages; legacy course shell excluded. |
| Deterministic source parser/IR | PASS for the two selected source families | Exact static assignments compile; source mutation and unknown assignments fail closed. |
| Generated visual composite | PASS as private Current-JS engineering candidate | Exact contract/state/frame pairs render; no AVM1 execution or original-runtime acceptance is implied. |
| Modern My Lesson integration | PASS | Retained modern host owns navigation, bounded controls, Replay, locale disclosure, and responsive layout. |
| Formal 56-page route binding | PASS locally | Clean build and local production-mode EN/ES routes return 200; zero legacy shells. |
| Ordinary/composite isolation | PASS | RW003 stays on ordinary render; FQ003, VB012, and TS007 use only their exact composite contracts. |
| Keyboard and responsive layout | PASS for sampled paths | Space activation and three viewports passed without horizontal overflow. |
| Accessible source mathematics | NOT ESTABLISHED | The source mathematics remains Canvas-based; no complete readable equivalent is accepted. |
| Audio | FAIL CLOSED / unresolved | Controls remain disabled; cue mapping, synchronization, traversal, listening, and acceptance are open. |
| Authoritative original-runtime/full-frame fidelity | NOT ESTABLISHED | Static source interpretation and browser state traversal do not replace Flash-runtime traces or full-frame comparisons. |
| Human visual review | NOT ESTABLISHED | Screenshots are engineering evidence, not a signed human visual receipt. |
| Owner acceptance | NOT ESTABLISHED | No Owner acceptance receipt was created. |
| Strict completion | NOT ESTABLISHED | Existing strict gates remain closed. |
| External deployment/release/publication | NOT AUTHORIZED / NOT ESTABLISHED | No commit, push, deployment, production-environment verification, or publication was performed. |
| Controlled known-family mini-batch | **CONDITIONAL GO** | Allowed only with exact allowlisting, deterministic regeneration, mutation tests, and the same browser gate. |
| Unattended lesson/grade scale-out | **NO-GO** | Arbitrary AVM1, drag/drop, randomness, dynamic text, audio, and unknown behavior remain unsupported. |

## Final recommendation

Freeze this two-page calibration as the reusable known-family checkpoint. Do not begin an unattended 52-page or whole-grade batch.

The next safest experiment is a three-page controlled mini-batch, with a dry-run source classification before any generated write:

1. `course-g05-l05-vb-013` — sibling fixed-choice page, to prove VB012 contract-family reuse rather than one-page memorization;
2. `course-g05-l05-ts-008` — sibling multi-section choice page, to prove TS007 contract-family reuse;
3. `course-g05-l05-fq-002` — sibling final-quiz assignment with a randomized-source branch, to stress the FQ003 compiler boundary without broadening to a lesson-wide batch.

Each page must fail closed if its source assignments do not match an explicitly versioned family. The mini-batch is allowed to proceed only through deterministic IR generation, source-mutation tests, ordinary/composite isolation, Replay and keyboard tests, English/Spanish desktop/tablet/mobile QA, clean route/build checks, and unchanged acceptance effects. Any new drag/drop, randomized runtime choice not reducible to exact source order, unsupported dynamic text, or audio dependency stops that page and returns the scale decision to NO-GO.

Only after that mini-batch passes should Codex recommend a larger structural batch. Learner/product scale remains separately blocked until accessible mathematics, audio, authoritative original-runtime/full-frame fidelity, human review, Owner acceptance, strict completion, deployment, and publication gates close.

## Principal working-tree artifacts

| File | SHA-256 at evidence freeze |
| --- | --- |
| `scripts/lib/g5-l5-representative-behavior-composites.mjs` | `a78554d63335d797c9c393485fd2c0cc8c77c9578d8a4cb3027aedf2d592b173` |
| `scripts/build-g5-l5-vb012-ts007-behavior-aware-canvases.mjs` | `858d888a4485e0fba3168416fc40fac178a6045d551e115de011920aa7a4ec65` |
| `scripts/build-g5-l5-vb012-ts007-behavior-aware-canvases.test.mjs` | `5a8dacc7c4824e5c9d06eb5bd928a624547a2aa59f58aaaba03e2c8011c0457b` |
| `scripts/build-g5-l5-page-only-product-release.mjs` | `c65424ba6eb933c54fed51031d54040c99617fa79f21c01e83d92b393f839f57` |
| `packages/demos/src/g5-l5-four-page-product-vertical-slice-state.ts` | `76824df018d2a0031cb713efc9d9b8fe9a241636cfcbc4fd347fc964b1cbc57d` |
| `packages/demos/src/g5-l5-four-page-product-vertical-slice.tsx` | `1367ab31a8cdda421232c0db16da533aae769aff8f400d5fa8b6cf87671ad01a` |
| `apps/web/lib/g5-l5-product-bridge-descriptor.ts` | `13a1abb98756aaa3a824e74ae53bce850e28b57f9a9e242526ff11512ce4f461` |
| `apps/web/lib/page-only-current-js-navigation.server.ts` | `cf57888a4332d9f0787f8533d5a51ea9d1a9f6031cf356c4c46040107c9b7c87` |
| `apps/web/components/descriptor-driven-whole-lesson-player.tsx` | `e45a71323020b22d428df8a776f5584d07bdcf9e540042a675bd21d9084e2b67` |
| `catalog/page-only-current-js-product-releases.json` | `07a5148793fbfc84df85867d9209cea219d8752d294006ee6450f9020919f697` |

These are working-tree identities, not commit, release, deployment, or acceptance receipts. The checkout contains unrelated concurrent work that was preserved.
