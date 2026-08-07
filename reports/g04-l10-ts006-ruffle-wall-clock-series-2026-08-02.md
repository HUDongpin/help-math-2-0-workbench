# G4 L10 TS006 Ruffle wall-clock series — 2026-08-02

## Outcome

The contained standalone Ruffle reference for `course-g04-l10-ts-006` produced the same native-raster image at 0, 1, 5, and 20 seconds after explicit playback activation, in both the English and Spanish localized reference routes. All eight post-activation PNG files have SHA-256 `87207dc5a2e5c96e9d09c01729b642d7e0f3ad836426aedc66fd86f5266b2f0d`.

This is a useful fail-closed result, not a fidelity baseline. The static source audit places the named `animation` child (`sprite-13`, 245 frames) at root frame 6, while the standalone page SWF has a root stop state at frame 1 and expects parent-host/preloader behavior. The wall-clock plateau therefore shows that this standalone diagnostic did not establish entry into the child timeline. It does not show that the child is static in the original lesson host.

## Exact source and structural identity

- Release: `lesson-g04-l10-perimeter-area`, ordinal 41.
- Animation: `course-g04-l10-ts-006`.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS06.swf`.
- SWF SHA-256: `b0ad832f7d755e2f94dddc53e3267414c5d8430ed0e8c28d498cc5ec3c05160e`.
- Native stage: 800 × 600; 12 fps; root timeline: 10 frames.
- Source-static child candidate: `sprite-13`, 245 frames, direct named root placement `animation` at root frame 6, depth 3, translation 8,241 × 5,668 twips (412.05 × 283.4 pixels).
- Static ActionScript surface for this member: root stop/preloader handling, root `begin` stop state, and a child terminal stop. No interactive controls were enabled or inferred by this diagnostic.

## Probe method

Each run used the exact-release planner and hash-bound SWF API, a loopback-only local diagnostic build, Playwright Chromium, a real click on the Ruffle play overlay, device scale factor 1, and an 800 × 600 host-only capture rectangle. Every non-allowlisted HTTP or WebSocket request was intercepted and recorded. The two localized routes were captured independently.

The first attempted series (`...-20260802`, without `-r2-`) failed closed because port 3102 was not listening; its receipts record `ERR_CONNECTION_REFUSED` and contain no successful observation. The successful `-r2-` series was run only after the diagnostic route returned HTTP 200 and the SWF API returned the local forensic-only headers.

| Post-activation delay | EN PNG SHA-256 | ES PNG SHA-256 | Ruffle `isPlaying` | Page errors | Batch report SHA-256 |
| ---: | --- | --- | --- | ---: | --- |
| 0 ms | `87207dc5…6b2f0d` | `87207dc5…6b2f0d` | `true` | 0 / 0 | `bd2dd18f…ab8d90` |
| 1,000 ms | `87207dc5…6b2f0d` | `87207dc5…6b2f0d` | `true` | 0 / 0 | `6d82d79d…30596` |
| 5,000 ms | `87207dc5…6b2f0d` | `87207dc5…6b2f0d` | `true` | 0 / 0 | `47988379…ab49` |
| 20,000 ms | `87207dc5…6b2f0d` | `87207dc5…6b2f0d` | `true` | 0 / 0 | `1339a790…f83b` |

Batch reports:

- `output/playwright/lesson-ruffle-activated-natural-playback-diagnostics/lesson-g04-l10-perimeter-area/l10-ts006-wallclock-00000ms-r2-20260802/batch-activated-natural-playback-diagnostic.json`
- `output/playwright/lesson-ruffle-activated-natural-playback-diagnostics/lesson-g04-l10-perimeter-area/l10-ts006-wallclock-01000ms-r2-20260802/batch-activated-natural-playback-diagnostic.json`
- `output/playwright/lesson-ruffle-activated-natural-playback-diagnostics/lesson-g04-l10-perimeter-area/l10-ts006-wallclock-05000ms-r2-20260802/batch-activated-natural-playback-diagnostic.json`
- `output/playwright/lesson-ruffle-activated-natural-playback-diagnostics/lesson-g04-l10-perimeter-area/l10-ts006-wallclock-20000ms-r2-20260802/batch-activated-natural-playback-diagnostic.json`

## What the series proves

- The exact TS006 SWF can be delivered to and explicitly activated in the contained local Ruffle route.
- The play and unmute overlays were clear at capture time, the player reported `isPlaying=true`, and no page error occurred.
- The observed raster did not change across the four wall-clock delays or between the two localized routes under this standalone probe.
- Network attempts outside the diagnostic allowlist were blocked and recorded; they did not reach the server.

## What the series does not prove

- `isPlaying=true` does not identify an SWF frame, child frame, natural host entry state, or terminal state.
- An identical EN/ES raster does not prove English/Spanish Flash state or bilingual parity; the localized route language is not a verified SWF language selection.
- No audio cue, audibility, voice, language, synchronization, mute/unmute behavior, or Replay behavior was established.
- The PNGs are nondeterministic Ruffle observations, not authoritative Adobe/Animate original-runtime captures and not exact-frame baselines.
- No full-frame comparison or normalized RMSE is admissible from this series.
- No human visual review, owner acceptance, strict completion, whole-lesson admission, or publication effect follows.

## JavaScript engineering boundary

The same exact source now also has an unregistered, fixed-English source-static engineering candidate for `sprite-13`:

- Runtime: `public/flash-assets/courses/course-g04-l10-ts-006/canvas-renderer.js`, 266,166 bytes, SHA-256 `ba4ab8464a6351576ee17bcd3ea0a542a0589652b9c6038b1da61328c02b2695`.
- Manifest: `public/flash-assets/courses/course-g04-l10-ts-006/manifest.json`, SHA-256 `698ba38db06bf0978234280c2cf63f358f2ab918f4de56d4b60e75188b663bc6`.
- Timeline/module: `packages/demos/src/timelines/course-g04-l10-ts-006.ts` and `packages/demos/src/modules/course-g04-l10-ts-006.tsx`.
- ActionScript execution, controls, audio, Spanish visuals, natural runtime, Replay, fidelity, and product registration remain disabled or unresolved. `strictAcceptanceEffect=none`.

The current-JavaScript candidate also has an exact full-canvas RGBA census:

- Frame domain: `sprite-13`; rendered local frames: 245/245.
- Comparison method: `full-canvas-rgba-byte-equality`.
- RGBA bytes per frame: 1,920,000.
- Consecutive pairs compared: 244; byte-identical pairs: 244; changed pairs: 0.
- Transition start frames: none.
- Frames byte-identical to frame 1: 245/245;
  `allFramesByteIdenticalToFrameOne=true`.

This is an exact raster census of the current JavaScript source-static
engineering candidate only. It proves that the present candidate renders the
same raster for all 245 requested local frames; it does not prove that the
original Flash child is static. The standalone Ruffle plateau and the
current-JavaScript raster plateau are separate observations: Ruffle did not
prove entry into `sprite-13`, while the current candidate does not express a
visual transition within that requested domain. Neither establishes an
original-runtime frame binding, natural host entry, behavior parity, audio,
full-frame RMSE, human review, or owner acceptance.

## Required next evidence

The next admissible TS006 baseline must enter the page through an authorized original lesson host or a source-proven equivalent fixture, record the parent/root/global entry state, verify the transition to root frame 6 and `sprite-13`, record the observed child playhead, bind every bitmap to the exact child frame domain, trace identity, and entry-state SHA, and include named-human audio listening. Only then can the JavaScript frames be compared at matching states, the source of the current candidate's raster plateau be diagnosed, and normalized RMSE be evaluated.
