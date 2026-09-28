# course-g04-l03-ti-006 Migration Brief

Updated: 2026-09-08. Scope: the English main activity in modern My Lesson, engineering review only. Human/Owner decisions remain pending.

## Identity and purpose

- Placement: Grade 4, Lesson 3, Try It Question 5; active source-ordered page 28 of 39.
- Asset: `swf-8b1b570cb14dc3fd8f5a73920d0661b8a14c971eb477d5bfb6d8579f5ce842e8`.
- Purpose: represent money a person has with a positive number and money owed with a negative number, and place five source person cards on the number line.
- Complexity: interactive-understood. Retain compiler-assisted extraction, the existing generated drawing and maintained React/SVG state machine. The bounded manual repair addresses completion, typed glossary support, feedback and responsive/keyboard usability. Generated drawing output is not hand-edited.
- Integration: existing `course-g04-l03-ti-006` renderer and source-ordered modern My Lesson `/en/courses/4/3`; no new registration or legacy course-shell migration.

## Source identity and audit

Canonical SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI06.swf`, SHA-256 `8b1b570cb14dc3fd8f5a73920d0661b8a14c971eb477d5bfb6d8579f5ce842e8`. Adjacent FLA: SHA-256 `4143f5a7ac3816078ee076adf5157ceba538c6599360ed2e387b1a687e3df5ae`.

The current authoring report `work/animate/dependency-authoring-audits/course-g04-l03-ti-006/runs/run-VkToja/L3TI06.fla-authoring-audit.json` matches SHA-256 `097cb30a9da53d755427a5432129b85f65fa6c5ffeb70eabcfcca0fa93366a9e`. Frame-166 instances, source text, card/target transforms and Help text were independently extracted and checked. The dated candidate report's source-audit binding also matches the current audit. See `work/g4-l3-modern-product-review/20260908-try-it-money/source-card-help-evidence.json` and `source-glossary-evidence.json`.

| Person | Source amount | Signed value | Source target |
| --- | --- | --- | --- |
| Sapna | Has $5 | +5 | Mc_Tar_1 |
| Alex | Owes $6 | −6 | Mc_Tar_2 |
| Lola | Has $8 | +8 | Mc_Tar_3 |
| Nestor | Owes $3 | −3 | Mc_Tar_4 |
| Sue | Has $3 | +3 | Mc_Tar_5 |

The source and target library text match for all five cards. Sorted by target x position, the values are −6, −3, +3, +5, +8. The source drag scripts bind Scr_N to Mc_Tar_N, return a wrong card to its origin and increment the count only on the matching target. The source loop mentions six names, but the actual authored placement contains five cards and the completion condition is five; no sixth card is invented.

## Timeline, interaction and rendering

The stage is 800 × 600 at 12 fps. Root frame 6 places Sprite 269 at (412.4, 283.3). The main timeline contains 167 frames; ordinary playback stops at interaction frame 166, and frame 167 remains post-stop inspection. Live interaction uses clean drawing frame 165 under the maintained controls. A deterministic evidence request retains its requested frame and excludes the learner overlay.

A correct drop hides the source card and reveals its target. Correct feedback projects nested Coach_audio_2a frames 2–20 into a 19/12-second current-JS delay. This projection is not an original-runtime timing trace. The page completes only after all five cards are placed and the final feedback finishes. Pause freezes the remaining feedback time. Replay clears the local activity and runtime completion; persisted lesson history remains separately managed by the host.

The generated drawing remains unchanged. Maintained code adds a clear Help button, stable drawing state, visible selected targets, an unobstructed final notice and phone previews showing the person, Has/Owes and amount above the correct position. Phone target controls also identify the placed person. Keyboard feedback closes with Escape, Tab/Shift+Tab remain within the open dialog, and focus moves to the next available card after feedback has committed; after the last card it moves to Help.

## Glossary and Help

- Main static placement windows: Position at frames 4–5, 7–113 and 114–167; Number line and Owe at 114–167.
- Help Sprite 263 is initially hidden at main frame 166. Its Owe, Negative number and Positive number entries are exposed only by the live Help state at that frame, with a ready canvas and supported English context.
- These are six entry points for five distinct terms. They use exact language-specific IDs in the existing grade-wide glossary through typed host requests. AVM1 and legacy getURL are not executed; the unresolved lesson-versus-grade-wide source authority is retained in metadata.
- The original Help sentences are retained: “Owing money means negative numbers” and “Having money means positive numbers.” The modern figure has 21 equally spaced ticks from −10 through +10, including zero. The source main question retains its −8 through +8 number line.
- Decimal Button 147 is inventoried inside an exported Sprite 148 (`toptxt`), with no main/Help placement or literal dynamic attachment found. No learner Decimal button is added. Original dynamic reachability remains unproven.

## Implementation and validation

Maintained renderer: `packages/demos/src/modules/course-g04-l03-ti-006.tsx`. Pure model: `packages/demos/src/timelines/course-g04-l03-ti-006-number-line-drag-interaction.ts`. Source/term configuration: `packages/demos/src/timelines/course-g04-l03-ti-006.ts`.

The 33 targeted tests include all 120 card placement orders, exact source mappings, Replay, unsupported contexts, glossary frame boundaries and evidence-overlay exclusion. Demos type/registry checks pass. Full Web typecheck still has the existing six mixed-Playwright type errors. Actual desktop, mobile, help, keyboard, pause and drag observations are recorded in the page review report; earlier failed observations remain preserved.

## Audio and acceptance boundaries

Existing Web audio was rehashed, without changing its files:

- en: `67c7a828d39a62d3445f1a4f64eb68b1c0902b10ce4f09f7026ba555e0b8794f`, 13832 ms; `apps/web/public/flash-assets/courses/course-g04-l03-ti-006/audio/embedded-stream-0001.mp3`.
- es: `c435c1947826678ff4058c58b89943f680408e229bfa5fdc0f0e669e635c4c31`, 18384 ms; `apps/web/public/flash-assets/courses/course-g04-l03-ti-006/audio/spanish-host-narration.mp3`.

The Spanish narration also matches the canonical associated MP3. These are technical byte and duration checks, not listening acceptance. Random feedback audio is not modeled; Spanish interaction/visual runtime, AVM1 randomness and original companion behavior remain unaccepted.

See `work/g4-l3-modern-product-review/20260908-try-it-money/REVIEW.md` and its receipt for the final bounded result. Engineering reviewer: Codex. Actual human visual/audio reviewer and Owner decision: pending. Original runtime, fidelity, audio listening, human/Owner review, strict completion, the frozen 16-page calibration batch, release and deployment are independent. Throughput: one existing page repaired; new registrations: zero. Factory efficiency, model cost and human-review effort were not measured or compared.
