# shell-course-g04-l01-index-local Migration Brief

Created: 2026-07-20
Candidate implementation and QA updated: 2026-07-22

## Objective

Provide a native Next.js/React candidate for the Grade 4 Lesson 1 course shell while the authoritative Flash-runtime baseline remains incomplete. The candidate preserves the source 800 × 600 coordinate system, the original eight-section order, all 80 active XML page placements, English/Spanish section titles, deterministic query inputs, Replay, keyboard-native controls, and a source-proven close-confirmation state.

This candidate is not a strict or one-to-one migration. It deliberately fails closed for every child destination and every unresolved legacy branch.

## Identity And Classification

- `assetId`: `swf-ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e`
- `animationId`: `shell-course-g04-l01-index-local`
- Collection: course platform shell; Grade 4; Lesson 1.
- Course: `Counting on Numbers`.
- Lesson title: `Place Value`.
- Spanish display term: `Valor posicional`, reused exactly from the VB Place Value `SpanSubTitleName` in the same `index.xml`. The XML has no explicit lesson-level Spanish-title field, so this remains an inference.
- Domain: `platform-shell`.
- Classification status/confidence: inferred / low. Missing FLA and missing authoritative original-host traversal prevent a stronger claim.

## Source Evidence

- FLA: unavailable.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index_local.swf`.
- SWF SHA-256: `ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e`.
- Course XML: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index.xml`.
- Course XML SHA-256: `b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2`.
- Provenance: owner-provided, frozen archive.
- Parsed source evidence: `audit/scenario-inventory.json`; parsing used Python `xml.etree.ElementTree` and made zero bare-ampersand repairs for this XML.
- The XML contains 8 active sections and 80 active page references. The provided archive/catalog contains 21 of those child SWFs; the other 59 referenced child SWFs are not present.

## Runtime Audit

- CWS, SWF version 6, AS1/2.
- Native stage: 800 × 600; 12 FPS; 50 root frames; 4166.6667 ms root duration.
- Background: `#ffffff` in the SWF header; the visible shell uses a pale-blue field and blue/gold chrome in the structural frame export.
- Complexity: high. Machine evidence records 600 exported scripts, 327 `DoAction`, 3 `DoInitAction`, 121 `DefineButton2`, 707 conditional branches, 344 unconditional branches, 165 frame labels, 211 sprites, and 144 editable-text definitions.
- Root frame 49 initializes section 1 / page 2 when no bookmark exists. Root frame 50 calls `doCreateSlide()`, exposes shell navigation, calls `loadSWFMovie()`, then executes `stop()`.
- The close button script moves the quit symbol to its confirmation frame. The affirmative legacy action uses JavaScript close and `fscommand("quit")`; both are prohibited in the candidate.
- Key Terms, Map, and Calculator button scripts prove those component branches exist. Their full authoritative visuals and interactions have not been traversed, so Key Terms and Calculator remain disabled in the candidate.
- The SWF contains embedded sounds/streams and conditional audio operations. Language, reachability, listening result, and synchronization remain unresolved; no cue is guessed.
- Legacy candidates (`SharedObject`, `fscommand`, `getURL`, `loadMovie`, reporting/bookmark URLs) are inventoried but never executed by the modern candidate.
- Tools: JPEXS FFDec 26.2.1 and swfmill 0.3.6. The FLA cannot be inspected because it is not present.

## Baseline

- `baseline/ffdec-root-frames.json` records 50 native-size structural root exports from the untouched SWF.
- This evidence is structural only: FFDec did not execute ActionScript, load child pages, traverse nested interactions, or prove audio.
- A local Ruffle load smoke test confirms only that the source loads without observed network requests; it is not an authoritative behavior or visual baseline.
- No authoritative original-host/Adobe traversal currently covers the main menu, every section/page, bilingual audio, utilities, history, quiz/reporting, terminal state, or Replay.

## Rendering Decision

- Selected for this candidate: React + semantic HTML + editable CSS geometry inside the fixed 800 × 600 aspect ratio.
- The palette and chrome are source-informed, while the information architecture and ordering come from `index.xml` and extracted scripts.
- No whole-frame screenshot, SWF, Ruffle player, CDN, legacy endpoint, or remote asset is used by the production renderer.
- React + SVG was not needed for the current navigation-only scope. Canvas/CreateJS and PixiJS would reduce semantics without resolving the missing authoritative branch evidence.
- This choice is a maintainable navigation candidate, not evidence of pixel fidelity. Source artwork extraction and frame comparison remain required before a fidelity claim.

## Timeline And State Machine

- Flash frames are one-indexed and clamped to 1–50.
- Frames 1–37: `loading-content`.
- Frames 38–48: `loading-layout`.
- Frame 49: `loading-page`.
- Frame 50: `ready`, matching the root `stop()` frame.
- `?frame=` freezes the exact reported frame; the stage emits `data-flash-frame`.
- `?lang=en|es` chooses source-backed bilingual lesson/section labels.
- `?seed=` is recorded deterministically but does not drive behavior because no random shell branch is yet proven in scope.
- `?scenario=` supports `default`, `section-ir`, `section-rw`, `section-vb`, `section-in`, `section-ti`, `section-gs`, `section-ts`, `section-fq`, and `quit-confirmation`.
- Explicit transitions cover section selection, return to map, request/cancel quit, and Replay. Invalid scenarios fall back to the menu.
- Reduced motion freezes this shell at the safe stopped navigation frame 50; existing modules continue to default to frame 1.
- Replay returns to the menu and restarts the root timeline through the shared runtime.

## Fail-Closed Navigation Contract

- Section order and labels: IR/Introduction, RW/Your World, VB/Important Words, IN/Learn It, TI/Try It, GS/Play It, TS/Practice Test, FQ/Final Quiz, with the XML Spanish section titles.
- All 80 page rows are present in XML order.
- 21 rows record their catalog `animationId`, but remain disabled because none is strict-complete.
- 59 rows are labeled `Source not provided` / `Fuente no proporcionada`.
- A page can render an `/animations/<animationId>` link only when its target is admitted by `catalog/completion-ledger.json`. The current candidate emits zero child links.
- The affirmative close action, Key Terms, Calculator, reporting, storage, LMS/JavaScript bridge, and remote help remain disabled.

## Implementation Map

- Next.js route: `/animations/shell-course-g04-l01-index-local` and `/es/animations/shell-course-g04-l01-index-local` in the local audit environment.
- Dynamic route file: `apps/web/app/[locale]/animations/[animationId]/page.tsx`.
- React renderer: `packages/demos/src/modules/shell-course-g04-l01-index-local.tsx`.
- Pure timeline/data/state machine: `packages/demos/src/timelines/shell-course-g04-l01-index-local.ts`.
- Tests: `packages/demos/tests/course-shell-g04-l01.test.ts` plus shared runtime/registry tests.
- Dedicated browser QA generator: `scripts/qa-shell-g04-l01-candidate.mjs`.
- Dedicated QA contract/evidence tests: `scripts/qa-shell-g04-l01-candidate.test.mjs`.
- Registry module: `./modules/shell-course-g04-l01-index-local`.
- Ruffle reference route: `/reference/shell-course-g04-l01-index-local`, local forensic use only.
- Standalone package: not requested.

## Verification Evidence

- Current shell tests pass 8/8 and `@helpmath/demos` typecheck passes. The tests exercise all 40 first/last-frame scenario/language endpoint combinations and require exact root-domain identity, including complete Replay reset to the menu after a scenario-bound render.
- `node scripts/qa-shell-g04-l01-candidate.mjs --base-url http://localhost:3427` generated the current `evidence/native-navigation-candidate-qa.json`. The report passed all 40 browser endpoints with exact frame/domain/root/scenario/language/seed/requirement/trace/entry-state identity, four representative 800 × 600 captures, local section/dialog navigation, 35 disabled Learn It child rows and zero child links, host and candidate Replay by pointer/Enter/Space, mobile overflow/dialog checks, reduced motion, dev-overlay suppression, and console/page/network checks.
- The candidate QA report SHA-256 is bound in `migration.json` as `evidence.candidateQaSha256`. The report also binds the current renderer, timeline, unit test, runtime contract, shared runtime, registry, product route/runtime/catalog dependencies, renderer endpoint audit, QA generator/test, preserved SWF/XML, and every screenshot by SHA-256.
- This browser evidence proves only the current JavaScript candidate contract. It explicitly grants no authoritative Flash baseline, original visual or behavioral parity, natural original-runtime traversal, full-frame/RMSE acceptance, audio parity, source Replay parity, strict-validator acceptance, human visual review, owner acceptance, or migration completion. Production build, authoritative original-host traversal, full-frame/RMSE comparison, formal assistive-technology review, human visual review, and owner acceptance remain pending.

## Accessibility

- Native buttons and links provide keyboard Enter/Space behavior and visible focus styling.
- Section navigation has an accessible name; unavailable pages state whether the source is missing or strict acceptance is pending.
- The quit confirmation uses `role="dialog"`, `aria-modal`, labels/descriptions, initial focus on the safe cancel action, and Escape cancellation.
- Replay is a native button.
- Reduced-motion playback uses frame 50 so the course menu remains available rather than freezing on a preloader.
- Desktop/mobile engineering checks passed, including keyboard Replay, safe dialog focus/Escape, reduced-motion frame 50, accessible names, bilingual labels, and no horizontal overflow at the tested mobile viewport. The manifest records these scoped engineering checks; formal tablet and assistive-technology product review remains pending and this evidence has no strict-acceptance effect.

## Exceptions And Decisions

1. The implementation is a native navigation candidate, not a one-to-one visual migration or an authoritative baseline.
2. All child destinations remain disabled until strict completion; no missing source is guessed.
3. The Spanish lesson-level title is inferred from an exact same-XML subpage term because no lesson-level Spanish field exists.
4. Embedded/conditional shell audio is not implemented pending authoritative listening and synchronization evidence.
5. Legacy close, network, JavaScript bridge, storage, reporting, remote-help, and child-`loadMovie` effects are disabled.
6. Key Terms and Calculator branches are visible as disabled controls; their exact runtime states are not claimed.
7. Human visual review and owner acceptance are pending.

## Completion

- Migration status remains `preserved`.
- Engineering review: pending.
- Human visual review: pending.
- The project user renewed the scope-limited approval of the current JavaScript output on 2026-07-22. The current artifact hashes are bound in `reports/current-javascript-output-human-approval.json`; this does not establish original-shell parity or satisfy strict all-diff human review or owner acceptance.
- Current candidate browser QA: pass; SHA-256 bound in `migration.json`; acceptance effect `none`.
- Owner review: pending.
- Strict validator: expected to fail until authoritative baseline, full scenario/audio evidence, visual comparisons, product QA, and reviews are complete.
