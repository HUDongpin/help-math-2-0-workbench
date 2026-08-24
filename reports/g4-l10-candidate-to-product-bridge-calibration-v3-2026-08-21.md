# G4 L10 candidate-to-product bridge calibration v3

Observed 2026-08-21, Asia/Shanghai. Baseline Git HEAD: `71485baa601fe600e8f63c88fb0139492a4ad31e`.

## Outcome

**CONDITIONAL GO — continue with another separately frozen low-lane batch.** TS006 crossed the existing-candidate bridge without creating a new workspace: maintained module → private registry → 46-position page-only descriptor → modern My Lesson host → Replay/audio lifecycle → desktop English and mobile Spanish QA.

The cumulative private calibration is now 4/24 audited candidates and 4/46 G4 L10 lesson pages. G4 L10 public course registration remains 0. Original-runtime fidelity, behavior parity acceptance, visual fidelity, audio listening acceptance, human review, Owner acceptance, strict completion, release eligibility, and publication all remain false.

## Freeze correction

The current freeze is `catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v3.json`, SHA-256 `9fed5ccb229a3f8135ec00c6a7976b0bf1367f9d9f5420e3ce7caa577bbbaf0f`.

V2 is preserved rather than rewritten. It correctly froze the TS006 source, candidate, reachability, audio, and acceptance boundary, but its `sectionPageOrdinal: 6` was invalid. The canonical active TS sequence omits TS04, so TS006 is active TS page 5 while remaining global lesson page 41. V3 invalidates only that ordinal and binds the private registry and descriptor to the corrected value.

## Measured yield

| Measure | Result | Meaning |
| --- | ---: | --- |
| This low-lane batch | 1/1 = 100% | The one deliberately frozen attempt reached the private modern host. |
| Cumulative deliberate attempts | 4/4 = 100% | The prior three pages and TS006 crossed the private bridge. |
| Audited candidate pool converted | 4/24 = 16.67% | Twenty audited candidates remain unregistered; this is not a 24-page yield claim. |
| G4 L10 private page coverage | 4/46 = 8.70% | The descriptor registers source ordinals 1, 7, 41, and 44 and leaves 42 positions unavailable. |
| G4 engineering Current-JS pages | 45/645 | Engineering coverage increased by exactly TS006, from 44 to 45. |
| G4 L10 public course registrations | 0 | The reviewer route remains development-only and outside the public course registry. |
| New workspaces | 0 | The batch reused `migrations/course-g04-l10-ts-006`. |

## Why TS006 qualified as low lane

- Exact page position: global 41/46, Practice Test active page 5.
- Exact root reachability: root frame 6 places instance `animation` on `sprite-13`.
- Candidate domain: `sprite-13`, 245 frames, source-static.
- Reachable handler count: 0.
- Random branch count: 0.
- External side-effect count: 0.
- Unresolved timeline count: 0.
- Source SWF SHA-256: `b0ad832f7d755e2f94dddc53e3267414c5d8430ed0e8c28d498cc5ec3c05160e`.
- Source FLA SHA-256: `4991dd4d87468d7c9162a88c94a15b8c7d251bc240e4c855b7b470976e887eb8`.
- Canvas renderer SHA-256: `ba4ab8464a6351576ee17bcd3ea0a542a0589652b9c6038b1da61328c02b2695`.

This qualifies the page for private bridge calibration, not original-runtime or visual-fidelity acceptance.

## Audio disposition

`scripts/materialize-g4-l10-ts006-private-audio.mjs` reproducibly materializes and checks two exact assets. Both pass `ffprobe` and full EOF `ffmpeg` decode.

- EN engineering cue: `embedded-stream-0001.mp3`, 101,530 bytes, 20,402 ms, 22,050 Hz mono, SHA-256 `d27c65e6bd7b9087b168e2a54ff60568e9481c84bd9996b87ef50392d8cc77e6`. It binds sprite-13 frames 1–245 with end frame 246. Its spoken language remains undetermined.
- ES user track: `spanish-host-narration.mp3`, 106,848 bytes, 7,632 ms, 48,000 Hz mono, SHA-256 `c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688`. It is learner-activated and uses the host's `pause-while-playing` contract. Listening acceptance remains false.

The materialization receipt is `migrations/course-g04-l10-ts-006/audit/private-product-audio-assets.json`, SHA-256 `4e38e9c6ceddd0ff7e8eb941b6fedcbc3373804291f5fc8b126dcc0971f3da61`.

## Product bridge and browser QA

The private registry now contains exactly IR001, VB003, TS006, and FQ001 under calibration v3. The descriptor preserves exact source order `[1, 7, 41, 44]`, fixes `courseShellCount` at 0, and keeps all acceptance effects false.

Desktop English at 1920×1080:

- Page 41 and Practice Test position 5 loaded in the modern My Lesson host.
- The TS006 Canvas renderer returned HTTP 200.
- The exact EN embedded stream returned HTTP 206.
- After autoplay refusal, Narration remained visible in the modern toolbar. A learner gesture loaded and played the cue.
- Replay retained page 41/46 and section position 5 and restarted the EN timeline-cue lifecycle.

Mobile Spanish at 390×844:

- The exact Spanish host track returned HTTP 206 and the UI changed to `El audio se está reproduciendo` with a Stop action.
- Replay stopped and reset the user-activated track to idle while retaining page 41 and section position 5. That is the host-track cleanup contract; it is intentionally different from an automatic EN timeline cue restarting on Replay.
- Spanish visuals continued to fail closed as unavailable. An ES audio file does not establish Spanish visual parity or audio parity.
- `documentElement.scrollWidth=375` and `window.innerWidth=390`, so the page had no horizontal root overflow.

Evidence:

- `output/playwright/g4-l10-product-bridge/desktop-en-ts006-v3.png`, SHA-256 `7e74025085a315063de34882568436b7ff3d4ae1c40735970f0c8b07cf28d92b`.
- `output/playwright/g4-l10-product-bridge/mobile-es-ts006-viewport-v3.png`, SHA-256 `ffe4297230cb7a75aaebd945655d2f8b8fcdec6eeb27c5984b91aff14bbc171f`.

There were zero product-asset request failures. Remaining console findings were development-provider issues from Clerk: its child-key warning, development-key warning, and telemetry request blocked by the app Content Security Policy.

## Verification

- TS006 materialization check: passed; four outputs, 208,378 audio bytes, 2/2 full EOF decodes.
- Materializer tests: 4 passed, 0 failed.
- Focused demos tests: 9 passed, 0 failed.
- Focused web tests: 7 passed, 0 failed.
- Full demos package: 637 passed, 0 failed.
- Full web package: 370 passed, 0 failed.
- Demos and web TypeScript checks: passed.
- Private registry regeneration check: passed.
- G4 L10 language/audio obligation matrix: passed for its existing 94 EN/ES obligations; its legacy 47-member report shape does not change the Owner-approved 46-page scope.

The first web package run correctly failed on stale G4 engineering-count assertions (44 instead of 45). The assertions were updated to the exact new 45/645 engineering count and the full 370-test package then passed. Public-release coverage was not expanded.

## Open global gates

The batch does not conceal or refresh broader repository blockers:

- `npm run verify:workbench` remains fail-closed because `catalog/completion-ledger.json` is stale.
- `npm run verify:sources` remains fail-closed on 99 unexpected source files beginning in unrelated G5 L4 FQ English-audio paths.
- The repository-root `npm test` remains fail-closed on broader historical/generated-currentness and unrelated profile-mode checks in the dirty worktree. The package-local demos and web suites above are green.

## Factory decision

The low-lane rule worked for this batch: exact source reachability and explicit audio disposition preceded registration, and the result crossed the private product bridge without a duplicate workspace or public authority change.

Proceed only with another separately frozen low-lane batch. Do not auto-register the remaining 20 audited candidates. Interactive-understood pages still require an exact typed contract for every reachable source handler. Behavior-heavy pages still require random branches, audio routing, timeline reachability, and Replay engineering behavior to close before private registration.
