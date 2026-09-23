# G5 L5 four-page product vertical slice and factory scale decision

Date: 2026-08-22  
Scope: Grade 5, Lesson 5, four active lesson-page placements only  
Legacy Flash course shell: excluded from every denominator  
Decision authority: current working-tree engineering evidence; no human, Owner, release, or publication acceptance is created

## Outcome first

**NO-GO for unattended/write-mode factory scale-out.**

The four-page experiment successfully implemented and exercised maintained JavaScript product state for a low-complexity linear page, a fixed-choice page, a multi-stop/help/feedback page, and a 26-question final quiz. It also integrated those controls into the retained modern My Lesson host and passed the English/Spanish desktop/tablet/mobile layout matrix.

The experiment nevertheless found a decisive product-visual blocker. On `course-g05-l05-fq-003`, the structural source-static Canvas draws the legacy `Mc_Finish` quiz-completion layer over live question frames. The extracted source script explicitly initializes that layer as hidden and only shows it after the last response; the source-static Canvas does not execute those AVM1 visibility transitions. The external React state machine therefore works while the learner-visible source visual is still wrong. This is the exact kind of gap the vertical slice was intended to reveal.

The safe next action is a **single-page, factory-level behavior-composite calibration on FQ003**, not migration of the remaining 52 G5 L5 pages and not Grade 5 scale-out. The generator needs a maintained intermediate representation for source-script visibility, timeline state, and dynamic text. A one-off hand patch to this generated Canvas would not establish a reusable factory.

## Gate decision

| Gate | Result | Evidence-scoped conclusion |
| --- | --- | --- |
| Page-only source identity | PASS | Four exact canonical SWF hashes and frozen FFDec/script artifacts are bound in code; no legacy shell is counted. |
| Current-JS registration | PASS | All four pages resolve through the generated private Current-JS registry. |
| Maintained JavaScript behavior | PASS with boundary | VB012, TS007, and FQ003 state machines execute their source-script-bound transitions. RW003 remains a linear transport lane. This does not execute AVM1 or prove original-runtime parity. |
| Modern My Lesson integration | PASS | Page controls are rendered in the retained modern host; modern navigation and Replay drive the slice. |
| Replay reset | PASS at product-state level | VB012, TS007, and FQ003 return to their initial product state. Original-runtime Replay parity remains unestablished. |
| Legacy quiz reporting | PASS, fail closed | FQ003 keeps results in memory; no legacy report request was observed. |
| Product visual behavior composite | **FAIL** | FQ003 renders the source-script-hidden finish overlay over questions. The static Canvas is not behavior-aware. |
| EN/ES responsive layout | PASS | 24 lanes (4 pages × 2 locales × 3 viewports) had no horizontal overflow. |
| Keyboard and target sizing | PARTIAL PASS | VB012 accepted Space-key activation. Slice buttons measured 48 px high on desktop/tablet and 46 px on mobile. |
| Accessible mathematics | **FAIL / incomplete** | Controls are semantic, but the source mathematics remains a Canvas image with a generic structural alternative; no source-proven readable problem equivalent is present. |
| Audio | FAIL CLOSED / unresolved | Audio controls remain disabled. Cue ownership, per-state mapping, synchronization, and listening acceptance are not established. |
| Natural Flash trace and fidelity | NOT ESTABLISHED | No authoritative original-runtime traversal, full-frame comparison, or replay-parity evidence was created. |
| Human/Owner/strict/release/publication | CLOSED | No human visual acceptance, Owner acceptance, strict completion, release, or publication authority is created. |
| Unattended factory scale-out | **NO-GO** | Structural extraction is insufficient for behavior-dependent visual state. |
| Bounded compiler calibration | GO | Continue only with the FQ003 behavior-composite generator fix and repeat this same four-page gate. |

## Four selected pages

| Animation | Complexity lane | Frozen source facts | Product behavior exercised | Current disposition |
| --- | --- | --- | --- | --- |
| `course-g05-l05-rw-003` | Low / linear / SWF-only | `sprite-129`, 631 frames, 0 user-event P-code files | Linear playback and modern Replay | Product visual composite unvalidated; no fidelity/audio claim |
| `course-g05-l05-vb-012` | Interactive understood | `sprite-234`, 196 frames, source stop 81, 3 user-event P-code files | Wrong feedback, Continue, retry, correct feedback, terminal frame, Replay reset | State machine passes; visual composite still unvalidated |
| `course-g05-l05-ts-007` | Behavior heavy | `sprite-439`, 690 frames, stops 245/384/510/628/671, 40 user-event P-code files | Five sections, two explanation states, help lock, wrong/correct cycles, terminal frame, Replay reset | State machine passes; visual composite still unvalidated |
| `course-g05-l05-fq-003` | Final quiz / behavior heavy | `sprite-830`, 72 frames, 109 user-event P-code files; exact Q1–Q26 and source answer key | 26 responses, exact score thresholds, result, 26-answer review, memory-only reporting, Replay reset | **Blocked:** source-script-hidden finish overlay is visible over question frames |

The exact FQ003 answer sequence exercised in the browser was:

```text
2, 4, 3, 1, 1, 1, 4, 3, 2, 4, 3, 4, 3,
3, 2, 1, 3, 4, 3, 2, 3, 1, 1, 1, 2, 2
```

All 26 correct responses produced `26 / 26` and the source-authored `Advanced` threshold. Review traversed all 26 answers and returned to the result. Replay returned to question 1 with zero stored responses.

## Decisive FQ003 visual evidence

The extracted source script contains both sides of the visibility contract:

- initialization: `Mc_Result._visible = false; Mc_Finish._visible = false; Mc_Finish.gotoAndStop(1);`
- terminal transition: after the response count exceeds the configured total, `Mc_Finish._visible = true; Mc_Finish.gotoAndStop(2);`

The generated source-static renderer declares that ActionScript behavior is not executed and that interactive state is unresolved. Its frame drawing still places `sprite16` (`Mc_Finish`) in the structural display list. The production screenshot therefore shows question 1 and the completion overlay at the same time.

Screenshot:

`output/playwright/g5-l5-four-page-product-vertical-slice-final-no-go-fq003.png`  
SHA-256: `5848fc5bc70a115816ad204ed3c66c7d7245242021d5f32d74afaac0fafd0dbf`

The private product bridge now exposes this failure in three ways:

1. a visible English/Spanish red engineering-blocker notice that says not to use the page with learners;
2. `data-page-product-visual-behavior-composite="blocked-source-script-hidden-finish-overlay-visible"` on the modern host;
3. `data-product-scale-decision="no-go-unattended-factory-scale-out"` and a matching descriptor contract.

## Browser matrix

The matrix used the production Webpack build at the exact modern My Lesson route. Each cell includes all four selected pages in both English and Spanish.

| Viewport | Canvas display size | Companion width | Minimum slice-button height | Horizontal overflow | EN | ES |
| --- | ---: | ---: | ---: | --- | --- | --- |
| Desktop `1440×1000` | `800×600` | 1177 px | 48 px | none | PASS | PASS |
| Tablet `1024×768` | `661×496` | 840 px | 48 px | none | PASS | PASS |
| Mobile `390×844` | `374×281` | 374 px | 46 px | none | PASS | PASS |

This is a layout/input result only. It does not override the FQ003 visual-behavior failure, unresolved audio, inaccessible source mathematics, or original-runtime gates.

Local production-browser console state was two known local-only Vercel Analytics harness errors (`/_vercel/insights/script.js` 404 and its MIME refusal), with no slice runtime exception. The request log showed local route/static requests and the Analytics request; it showed no legacy quiz-report request.

## Verification run

Current successful checks:

- `npm run typecheck --workspace @helpmath/demos`
- `npm run typecheck --workspace @helpmath/web`
- combined targeted tests: **7/7 passed**
- `npm run build --workspace @helpmath/web -- --webpack`: compiled, TypeScript passed, **24/24** static pages generated
- `npm run verify:sources`: **9,313 files**, **3,308,484,004 bytes**, read-only enforced, zero writable entries; manifest SHA-256 `f4de727e98372ca550b9f87220305c8b4d5b226b26e06573ae4ca7c7d40b9549`
- `npm run verify:workbench`: passed
- `npm run doctor`: 0 failures, 0 warnings
- `git diff --check`: passed

The root-wide `npm test` is **not claimed as passing**. An earlier sampled run exposed multiple pre-existing, cross-grade catalog/currentness and missing-workspace failures and was stopped after enough evidence showed it was not a slice-specific acceptance surface. The targeted slice, descriptor, type, build, source, and workbench checks above are the current evidence for this decision.

## Implemented files and current hashes

| File | SHA-256 |
| --- | --- |
| `packages/demos/src/g5-l5-four-page-product-vertical-slice-state.ts` | `68d39641c9de7bc07143f49a4aa54741bf7355800c1497441d213b0b423042e1` |
| `packages/demos/src/g5-l5-four-page-product-vertical-slice.tsx` | `956a966fdd99e9fbc6c5371a61b0ac639e88a21f4588c4c92984112edd31fc2f` |
| `apps/web/lib/g5-l5-product-bridge-descriptor.ts` | `ec3a846d89353f4ade4ea7d2984877338cff53900f333ec395c3c87b08cf055b` |
| `apps/web/components/descriptor-driven-whole-lesson-player.tsx` | `baee78c18d1c3b036f4ac9319417f23e091c1e00d77fba43b8d71dad1ff87c3c` |
| `apps/web/app/globals.css` | `195a4b5d2c1ec7f5c39daa1148fd0590b7d59350c765253729144ebe7c6c0fab` |
| `packages/demos/tests/g5-l5-four-page-product-vertical-slice.test.ts` | `dcf1773f86325298780702cd250d8506c61a1e471ce13d3d176d1164ecb48a61` |
| `apps/web/tests/g5-l5-product-bridge-descriptor.test.ts` | `d25df32131647d1356f327a74fd1cfce6195cc0457921cde0494d45c571cbe12` |

These are working-tree hashes, not a commit or release receipt.

## Exact next step and reopening criteria

Do not start a 52-page G5 L5 batch. Do not start another Grade 5 lesson batch. Keep the existing 56-page private registration and this four-page slice acceptance-neutral.

Implement one reusable factory feature against FQ003:

1. Parse source-script assignments that affect visibility, timeline state (`gotoAndStop`/`gotoAndPlay`), enabled state, and dynamic text into a deterministic behavior-composite IR.
2. Make the generated renderer consume that IR so `Mc_Finish` is absent during Q1–Q26, appears only in the terminal state, and result/review dynamic text is state-bound.
3. Generate machine assertions and screenshots for question, terminal result, first/last review, Replay reset, and every source-labeled frame family. Do not hand-edit only the FQ003 generated renderer.
4. Re-run the same four-page state, layout, keyboard, network, and visual matrix.

Reopen a **structural factory scale GO** only when the behavior-aware visual composite passes on all four lanes and the factory fails closed on unsupported source behavior. Reopen a **learner/product scale GO** only after the separate audio dependency/listening, accessible-math, authoritative original-runtime/full-frame, human visual, and Owner acceptance gates also close.

