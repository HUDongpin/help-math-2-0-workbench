# G4 L3 TS006 exact-PID Replay complete diagnostic v10

Status: **verified acceptance-neutral diagnostic; not authority, baseline, acceptance, strict completion, or release evidence**.

## Primary EN diagnostic integrity

- Exact-PID manifest selection: PID `97581`, `waited-first-window-exact-pid`, display crop `0.0,58.0,800.0,600.0`.
- Frames: 537/537 complete 800x600 PNGs; 0 reported drops/incomplete frames.
- Capture duration/effective cadence: 45.116886 s / 11.880253 FPS.
- Alpha mask: `61a3e6ea1072d68e50f8ff6353e8af4e9657994bd3262d106d549e7e82fa88ca`, one mask across 537 frames, 116 non-opaque pixels restricted to the native bottom corners.
- Horizontal registration: offsets `0`; one exact 800x60 top-anchor hash across all frames; detected drift: **none**.
- ALAC: `dcebe8af5e012b395f46ffebe8edae1a575807e5d2164924a133cd4a783fec06`, 48 kHz stereo, 5145502 bytes; decoded PCM `bb6750534eeddafb73188b101c17e7a4a47bd804fabe0ab1036cb9e70c46ad1f`, 5556452 nonzero bytes.

## Replay pixel sequence

- Stable instructional terminal prefix: ordinals 1–16; the interaction-neutral portion is 1–13.
- Pre-reset control-hover visual: ordinals 14–16.
- Reset visual transition: ordinal 17; reset-like pixel-identical plateau: 18–30.
- Observed reveal animation: ordinals 31–261.
- Terminal-like instructional suffix: ordinals 262–537; it persists through capture end. Only 536–537 are full-frame pixel-static because the footer and terminal pulse continue changing.
- Replay input causality and exact source-playhead mapping: **not established**.

## Separate Spanish page-audio diagnostic sibling

- Manifest: `04a130e60b07abf9df399fd0dc53f5e48d92f8c388f3a9c5a4692ce8bb98cf8f`; PID `97581`; 240/240 complete frames; zero drops.
- ALAC: `02165163f0c8692ee6194c6250705aa0aceba2506c2e4b93c31f375de23e7600`; decoded PCM: `95ec3b93269be7eac06398406c7015717417b5007fc7832184c95eddeb36283e`, nonzero.
- This sibling does **not** establish an independent ES account, natural trace, Spanish-language correctness, accepted audio timing/content, human listening acceptance, Owner acceptance, or strict evidence.

## Boundary

- All authority and acceptance fields remain false.
- Coverage, candidate, completion ledger, release ledger, and protected pins were not modified.
- The earlier 382-frame exact-PID capture remains retained as a superseded/incomplete diagnostic and does not contribute to v10 Replay segmentation.
- Report JSON: `reports/g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.json` (`5513c4d9ebd3658575ebe98f1a934eb18766c7006551d3cf6d52503175a9e0cf`)
- Report fingerprint: `6099d15ff79030e329d5d1f1740cbd5b8f4714ba40304ad1cdb67c038b4b16cb`
