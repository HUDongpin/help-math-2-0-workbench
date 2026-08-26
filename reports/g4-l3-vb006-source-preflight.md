# G4 L3 VB006 source preflight: Zero / Cero

This report is an acceptance-neutral, read-only source audit for `course-g04-l03-vb-006`. It creates no migration workspace, renderer, registry entry, route, ledger change, approval, or production admission.

## Result

- Frozen SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB06.swf` (62,750 bytes; SHA-256 `e83889619f1a162491b2d7bbc720be78c5ca1eda7f6348680a949e5a71e90168`).
- Frozen FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB06.fla` (361,984 bytes; SHA-256 `44ce279b65a6ffb552dc8f0b4f10f9bdc05b5bfe874bf6de574ef2cce418f058`).
- Native stage/root: 800×600, 12 FPS, 10 root frames.
- Main source-static drawing domain: `sprite-44`, 163 one-indexed frames, placed by root frame 6 at (401.3, 244.25).
- Companion page-title domain: `sprite-5`, 1 frame; it is not included in the in-memory main-sprite adapter preflight.
- Full current-JavaScript candidate source-supported now: **false**.
- Bounded English-only, muted, noninteractive source-static drawing candidate technically supported: **true**, but permission to implement remains **false** because final specification and renderer implementation authorization are still closed.

## Exact interaction obligations

| Button ID | First local frame | KeyAttribute | unresolved host call | Enabled by preflight |
|---:|---:|---|---|---:|
| 11 | 1 | `Zero` | `_root.DoHyperLinks()` | false |
| 12 | 1 | `Value` | `_root.DoHyperLinks()` | false |
| 42 | 116 | `Positive number` | `_root.DoHyperLinks()` | false |
| 43 | 116 | `Negative number` | `_root.DoHyperLinks()` | false |

The four handlers also call `_root.animation_mc.animation.stop()`. Root frame 1 calls `_level0.InternalPreloader.gotoAndPlay("jump_check")` and then stops; root frame 6 stops again. These are source-exact host dependencies, not inferred browser behavior.

## Audio and language boundary

- Embedded MP3 stream: `sprite-44`, blocks 7–163, 157 blocks, payload SHA-256 `2af05bf5b607a7370fba0b722713349d4da6bf93efafb3be6eff68601964895f`; decoded technically, not listened to or accepted.
- Catalog-associated `/SA/` MP3: 15.072s, 48000 Hz mono, SHA-256 `5a56dbcee1dff83597b928d59e7e25223d0c10709616338a7a55152bf87a67bd`; the path convention is a Spanish candidate only.
- The SWF text export proves English visual strings. It does not prove Spanish visual parity, host language selection, cue mapping, synchronization, Replay, or audio acceptance.

## Canvas feasibility preflight

- Fresh FFDec 26.2.1 sprite export: 697×382, 163 frames, 35 allowlisted drawing functions, 0 embedded images.
- The shared safe adapter builder succeeded in memory and produced a hash-bound runtime candidate (657,481 bytes; SHA-256 `ce6a6926eb2f977de4112f05672a7e0bb1c9ac31cd49507c8e28d55d82738813`). It was discarded; **0 renderer files were persisted**.
- Legacy ActionScript, pointer controls, audio, timers, autoplay, network, storage, and ambient DOM listeners were not enabled.

## Required next evidence

- Complete the prepared paired FLA/SWF recursive Adobe Animate audit with the named human present only to acknowledge the legacy conversion warning; close without saving, publishing, or exporting.
- Resolve the original G4 L3 host contracts for InternalPreloader.jump_check, _global.KeyAttribute, DoHyperLinks(), and _root.animation_mc.animation.stop().
- Build a frame-domain disposition for root, sprite-5, and sprite-44, and enumerate any dynamically created timelines from authoring/runtime evidence.
- Capture natural authoritative original-runtime traces for root entry, all four glossary hotspots, terminal state, Replay, English, and Spanish host states.
- Establish embedded/external audio language, cue, synchronization, stop/replay, and named-human listening evidence without substituting path convention for runtime proof.
- Although parallel-shard development entry is open, any engineering-only renderer using the recorded sprite-44 contract must remain English-only, muted, noninteractive, and non-production until final specification and renderer implementation authorization are explicitly established.

## Acceptance boundary

| Gate | Accepted |
|---|---:|
| `implementationAuthorized` | false |
| `implementationCreated` | false |
| `migrationScaffoldCreated` | false |
| `authoritativeOriginalRuntimeComplete` | false |
| `naturalRuntimeReachabilityComplete` | false |
| `frameDomainDispositionComplete` | false |
| `bilingualVisualParityComplete` | false |
| `audioAccepted` | false |
| `replayParityComplete` | false |
| `fullFrameRmseComplete` | false |
| `behaviorComplete` | false |
| `productQaComplete` | false |
| `accessibilityQaComplete` | false |
| `humanVisualReviewAccepted` | false |
| `ownerAccepted` | false |
| `strictMigrationComplete` | false |
