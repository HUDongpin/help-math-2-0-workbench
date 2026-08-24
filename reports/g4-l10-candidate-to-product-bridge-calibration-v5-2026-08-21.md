# G4 L10 candidate-to-product bridge calibration v5

Observed 2026-08-21, Asia/Shanghai. Baseline Git HEAD: `71485baa601fe600e8f63c88fb0139492a4ad31e`.

## Outcome

**CONDITIONAL GO — the interactive-understood bridge now has measured product yield; the remaining audited pool has no honest low-lane page.** VB011 crossed the existing-candidate bridge without a new workspace: maintained reusable glossary wrapper → private registry → 46-position page-only descriptor → modern My Lesson host → typed glossary/Replay/audio behavior → desktop English and mobile Spanish QA.

The cumulative private calibration is now 5/24 audited candidates and 5/46 G4 L10 lesson pages. G4 L10 public course registration remains 0. Original-runtime fidelity, behavior parity acceptance, visual fidelity, audio listening acceptance, human review, Owner acceptance, strict completion, release eligibility, and publication all remain false.

## Freeze chain

V4 remains the immutable implementation-before-freeze:

- `catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v4.json`
- SHA-256 `65a8a4a4aa6aec8638979cf606d21a477b6a9fcce65e9c47090a1fa6e599ff93`

It freezes the complete 20-candidate audit, the finding that zero candidates honestly qualify as low, and VB011's exact source, candidate, placement, handler, glossary, and audio facts before product implementation.

V5 does not rewrite V4. It is the current registry-shape successor:

- `catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v5.json`
- SHA-256 `a7f814ecccb66576da40ba4406d8efb745c13ab36d6af757792f79fbddc054b1`

V5 only normalizes the cumulative five-page selection into the `selectedPages` array required by the existing private registry generator.

## Measured yield

| Measure | Result | Meaning |
| --- | ---: | --- |
| This interactive-understood batch | 1/1 = 100% | The one separately frozen VB011 attempt reached the private modern host. |
| Cumulative deliberate attempts | 5/5 = 100% | All deliberately frozen calibration attempts crossed the private bridge. |
| Audited candidate pool converted | 5/24 = 20.83% | Nineteen audited candidates remain unregistered. |
| G4 L10 private page coverage | 5/46 = 10.87% | The descriptor registers source ordinals 1, 7, 15, 41, and 44 and leaves 41 positions unavailable. |
| G4 engineering Current-JS pages | 46/645 | Engineering coverage increased by exactly VB011, from 45 to 46. |
| G4 L10 public course registrations | 0 | The route remains development-only and outside the public course registry. |
| New workspaces | 0 | The batch reused `migrations/course-g04-l10-vb-011`. |

## Why VB011 qualified as interactive-understood

- Exact position: global page 15/46, Important Words active page 10.
- Exact root reachability: root frame 6 places instance `animation`, depth 4, on `sprite-31`.
- Candidate domain: `sprite-31`, 153 frames, source-static.
- Source button placement: both controls first exist at sprite frame 4.
- Reachable release handlers: exactly 2.
- Clip handlers: 0.
- Random branches: 0.
- Unresolved frame domains: 0.
- Source SWF SHA-256: `dd12bb87cffa76948020b1cfc34163f67fa4062bd286ea571bf4b08473709ba0`.
- Source FLA SHA-256: `b561dd6e3e1a7ea154094c9d4d58495c7b84111204394d5c97a5e87f362d68fa`.
- Canvas renderer SHA-256: `0315d7255b5333cbbea8e8d25af42b8c8351a537ab6cd5032b3c5466a58b2947`.

The source handlers map narrowly:

- Character 10, `KeyAttribute = Formula` → `{type: "open-glossary", entryId: "formula"}`.
- Character 11, `KeyAttribute = Equation` → `{type: "open-glossary", entryId: "equation"}`.

The maintained wrapper lives at `packages/demos/src/private-source-static-glossary-candidate.tsx` and is now shared by VB003 and VB011. It validates unique entry IDs, KeyAttribute values, source character IDs, bounded first frames, and labels. It provides only a typed, memory-only glossary capability. Legacy HLA click recording remains blocked: no legacy persistence, dispatcher, endpoint, or network request exists.

## Exact glossary data

The definitions remain bound to the Grade 4 English and Spanish Key Terms XML hashes.

- Formula / Fórmula: “An equation that states a mathematical rule.” / “Una ecuación que establece una regla matemática.”
- Equation / Ecuaciòn: “A mathematical sentence that shows that two expressions are equal.” / “Un enunciado matemático que muestra que dos expresiones son iguales.”

Opening either dialog pauses the modern host. Closing it restores playback. This is the typed modern equivalent of the source `DoHyperLinks` plus timeline-stop intent; it is not evidence that ActionScript executed.

## Audio disposition

`scripts/materialize-g4-l10-vb011-private-audio.mjs` reproducibly materializes and checks two exact MP3 assets. Both pass `ffprobe` and full EOF `ffmpeg` decode.

- EN engineering cue: 62,920 bytes, 12,643 ms, 22,050 Hz mono, SHA-256 `ab8c00ecbf6c90d284a295fee5a785fc7e3478490382fcda0b7064be1bfd1e66`. It binds sprite-31 frames 2–153 with end frame 154. Its spoken language remains undetermined.
- ES user track: 187,152 bytes, 13,368 ms, 48,000 Hz mono, SHA-256 `1508e26d670d3f53a9e5f3d2b3945c8167d1ba8cd0e7a1959bf726fcb203e87f`. It is learner-activated and uses `pause-while-playing`. Listening acceptance remains false.

The materialization receipt is `migrations/course-g04-l10-vb-011/audit/private-product-audio-assets.json`, SHA-256 `f933acece0c6f23eca9ca145f671b9e86dd2217abd8b06eba8caef721be7d560`.

## Product bridge and browser QA

The private registry now contains exactly FQ001, IR001, TS006, VB003, and VB011 under calibration V5. The descriptor preserves source order `[1, 7, 15, 41, 44]`, fixes `courseShellCount` at 0, and keeps all acceptance effects false.

Desktop English at 1200×830:

- Page 15 and Important Words position 10 loaded in the modern My Lesson host.
- The VB011 Canvas returned HTTP 200; the exact embedded cue returned HTTP 206.
- Replay reset the timeline. At source frame 7, both controls whose source placement begins at frame 4 were enabled, and the embedded cue exposed its Stop action.
- Formula and Equation each opened a typed dialog with the exact English definition; the host switched to paused while each dialog was open.

Mobile Spanish at 390×844:

- The source visual remains fixed-English and is explicitly labeled as English-limited; Spanish visual parity is not claimed.
- Fórmula and Ecuaciòn each opened a memory-only dialog with the exact Spanish definition.
- The exact Spanish host track returned HTTP 206.
- During the ES host track, `data-host-audio-timeline-paused=true`; the runtime remained at frame 6 across a 700 ms observation, proving `pause-while-playing` engineering behavior.
- `documentElement.scrollWidth=375` and `window.innerWidth=390`, so there was no horizontal page overflow.

Screenshots:

- Desktop: `output/playwright/g4-l10-vb011-v5/.playwright-cli/page-2026-08-20T17-36-25-612Z.png`, SHA-256 `fbc55983273481e443b1ed92eceb5957b47395718e7de1e37871c23fc6c669a0`.
- Mobile: `output/playwright/g4-l10-vb011-v5/.playwright-cli/page-2026-08-20T17-40-37-933Z.png`, SHA-256 `3b6a1654a2ecaa05f3cb0f095d8100c7a879f053ef1b76703fbf093d68389b6c`.

There were zero product-asset request failures. The development browser still showed unrelated Clerk findings: its experimental checkout child-key warning, development-key warning, and telemetry request blocked by the app Content Security Policy.

## Verification

- VB011 audio materialization check: passed; four outputs, 250,072 audio bytes, 2/2 full EOF decodes.
- Materializer tests: 4 passed, 0 failed.
- Focused demos tests: 18 passed, 0 failed.
- Focused web tests: 12 passed, 0 failed.
- Full demos package: 643 passed, 0 failed.
- Full web package: 371 passed, 0 failed.
- Demos and web TypeScript checks: passed.
- Private registry regeneration check: passed.
- Web lint: 0 errors; two pre-existing `tutor-integration.ts` unused-parameter warnings remain.
- Production web build: passed and includes the dynamic local G4 L10 product-bridge route.

## Open global gates

The batch does not conceal or refresh broader repository blockers:

- `npm run verify:workbench` remains fail-closed because `catalog/completion-ledger.json` is stale.
- `npm run verify:sources` remains fail-closed on 99 unexpected source files beginning in unrelated G5 L4 FQ English-audio paths.
- The repository-root `npm test` remains fail-closed on broader historical/generated-currentness, G5 L4/G5 L5, G4 L3 profile-custody, and completion-ledger checks in the dirty worktree. Package-local demos and web suites are green.

## Factory decision

The interactive-understood factory rule worked: every reachable handler received an exact typed host mapping before registration; the source/audited audio was staged without inference; no duplicate workspace or public authority change was created.

Proceed only with another separately frozen interactive-understood audit. Do not force any remaining page into the low lane: the audited remainder has zero honest low candidates. Do not auto-register the remaining 19 candidates. Behavior-heavy pages still require random branches, audio routing, timeline reachability, and Replay engineering behavior to close before private registration.
