# course-g04-l03-gs-002 Migration Brief

Updated: 2026-09-08. Modern-product engineering review; no new human/Owner or strict acceptance.

## Placement and implementation lane

Grade 4, Lesson 3, Play It / Game 1, source-ordered active page 29 of 39. The instructional task uses positive and negative moves to position a ship on a vertical number line from −7 through +7 and reach a target. The source is an existing, registered Current-JavaScript page at `/en/courses/4/3`.

This bounded review treats the timed game as behavior-heavy: random target selection, concurrent timer/movement, input validation, scoring and nested feedback require a maintained state machine. Retain compiler-assisted public-tool extraction, the existing source-locked generated drawing and the existing React state machine. The advanced-manual work repairs host completion, keyboard behavior and responsive display; it does not authorize bulk generation or alter a generated asset.

## Source identity and evidence

- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/GS/L3GS02.swf`, 933353 bytes, SHA-256 `d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29`.
- FLA: adjacent `L3GS02.fla`, 4945920 bytes, SHA-256 `096d332d7572235e61c607c6230689713857144243b023026d43786bc5df8b1f`.
- Runtime structure: CWS version 6, AS1/2, 800×600 at 12 fps, root 10 frames. Root frame 6 places Sprite321; its main timeline contains 428 frames and stops at game-entry frame 427.
- `audit/machine/swfmill.xml.gz` and `ffdec-scripts.txt.gz` provide the current source geometry, glyph text and script evidence. Read-only extraction is recorded under `work/g4-l3-modern-product-review/20260908-game-1/`.
- The prior Animate dependency-authoring attempt `run-2N9wQM` failed with SIGABRT and produced no audit artifact. FLA bytes are bound, but no successful FLA authoring report or original-runtime trace is claimed.

`source-game-evidence.json` binds both 15-element position arrays, the four original validation messages, the direction/movement/scoring scripts and Help text decoded through the embedded font glyph maps. The source initializer uses `virusY[7]` for the initial ship, while movement uses `shipY`; the existing modern layer consistently uses `shipY`. This remains an explicit initial-pixel difference, not original-runtime parity.

## Game behavior and product decisions

Positive direction subtracts from the array index and moves upward; negative direction adds to the index and moves downward. The ship starts at zero. The initial target selects among fourteen nonzero positions; later targets exclude the current ship position. The maintained seeded random generator is reproducible and does not execute or claim to reproduce AVM1 random state.

Input remains restricted to two digits. Missing sign, missing number and moves above +7 or below −7 use the original messages. A zero-distance move receives the existing modern explanatory error. A legal miss moves the ship without increasing the score; a hit increments the score once, displays feedback, then selects a different target.

The existing product timer runs a standard four-minute countdown. Movement projects child-frame behavior into 750 ms steps, and hit feedback uses a 900 ms modern duration. The original minute/second script and its differences remain recorded. These are Current-JS timing decisions, not original-player timing or audio-sync evidence. Host Pause freezes the timer and movement; Help and validation feedback suspend the game clock. Hit CSS animations now also pause with the host.

The page uses `completionMode: activity` and reports completion when the game timer expires, rather than when the introductory timeline reaches frame 427. New Game resets the round and advances the deterministic target; host Replay resets the original seed, activity and runtime completion. A completed-round result is a regular region so keyboard users can continue to the course controls; it is not a modal keyboard trap.

## Glossary, keyboard and responsive interface

Source Buttons17/18 place Positive sign and Negative sign at main frames 86–425. Exact typed English/Spanish glossary entry IDs are exposed only in that introduction window, in the supported English visual context, outside deterministic evidence capture. Sprite19 contains a duplicate definition-only export without a placement or literal dynamic attachment; it is not used to invent Help controls. No legacy getURL or ActionScript is executed.

The English Negative sign definition in both existing grade-wide indices omits zero in the phrase “to the left of on the number line.” The maintained learner display restores “to the left of 0 on the number line,” using exact entry ID, title and original-text guards. Evidence mode and generated source indices remain byte-identical; the Spanish definition already names zero and is preserved.

Controls and the game clock stay disabled until the clean base canvas is ready. Help and error dialogs support Escape and contain Tab/Shift+Tab. Focus returns to the appropriate control after closing a dialog, moving, scoring or starting a new round; initial mobile focus waits for the companion portal to commit. Phone controls show readable ship/target positions, timer and score, retain at least 48-pixel label/button targets, and cover both narrow screens and coarse pointers.

## Preserved rendering and diagnostics

The generated main canvas SHA-256 remains `1c806e2fdeb026edb5b0109ab24bac3689918894b3d7e38fe17503dfbbc1bfb1`. The clean interaction-base successor remains `7e4d352d925c65b1ba1d3d1329d95c690e27be4e2ed01e6683b10c2c12cd4797`. The main canvas handles introduction and evidence drawing; the maintained game layer owns actors, timer and score over the existing clean base. Both inline ship/target PNGs retain their source-export hashes.

The exact English Sprite319 source-composite diagnostic, its identity requirements, 186 local frames and 103 unique target visuals remain preserved. Unsupported context/language and deterministic capture paths do not gain learner game controls. Frame428 remains post-stop inspection; natural original terminal continuation is still unproven.

## Validation and current limitations

The final 31 targeted demos tests cover the game state, source asset hashes, exact diagnostics, unsupported contexts and glossary boundaries. Eleven Web checks cover learner-copy preservation and host completion. Demos type/registry checks pass. The broader initial final-page regression retained its pre-existing TS007 `11 !== 1` assertion failure; the full Web typecheck retains six existing mixed-Playwright installation errors. Neither is described as fixed by this page.

Actual browser evidence covers ordinary up/down moves, a legal miss, scoring, movement/feedback pause, Help clock suspension, keyboard behavior, phone full-range/cross-zero moves, New Game, Replay and timer expiry. Final report and file bindings: `work/g4-l3-modern-product-review/20260908-game-1/REVIEW.md` and `product-review-receipt.json`.

Existing Web audio remains unchanged: English `ed051453f3f40cab498ebae515d3694081d7af24896ae7c7c1d38c5610af383a`, 34970 ms; Spanish `bb022576cb0f787245c17fdad4ef2d324115f7066fe2a9732ad27130ee86af68`, 50880 ms. Spanish matches the associated canonical MP3. These are technical byte/duration checks; gameplay feedback audio, Spanish visual/interaction behavior, original-runtime synchronization and listening acceptance remain unaccepted.

Engineering reviewer: Codex. Actual human visual/audio reviewer and Owner decision: pending. Prior IN004 Owner approval remains bound to its original snapshot. New registrations and new Owner approvals: zero. Original runtime, fidelity, audio listening, human/Owner review, strict completion, frozen calibration, release and deployment remain independent. Model cost, factory efficiency and human-review effort were not measured.
