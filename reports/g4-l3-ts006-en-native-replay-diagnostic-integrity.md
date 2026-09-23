# TS006 EN native Replay diagnostic integrity

Status: **verified acceptance-neutral visual diagnostic; not authoritative and not promotion eligible**.

This report verifies the exact raw bytes and derives a deterministic pixel-sequence finding. It does not establish an authorized natural trace, Replay input causality, exact local playhead values, audio acceptance, human review, owner acceptance, strict completion, or release readiness.

## Capture integrity

- Capture manifest: `artifacts/full-frame/g4-l3/ts006-en-native-replay-diagnostic-20260726T213100+0800/capture-manifest.json` (`a1ccd34fd01f7bde46353177f396b41985198fe8142a621148d28cbdfe1254fb`)
- Report JSON: `reports/g4-l3-ts006-en-native-replay-diagnostic-integrity.json` (`cb78417f6b369fdd766be3556d7750a4e9cec72e83d44c0b462cfb0fa92d6138`)
- Flash Player owner/title: exact match; ScreenCaptureKit window ID `6310`
- Exact Unix PID binding: **not present**. Source mode is `window`, PID wait is `0`, and `display.includedProcessID` is absent. The window ID is not a PID.
- Frames: 477/477 complete 800x600 PNGs; capture tool reports 0 drops/incomplete frames.
- Requested cadence: 12 FPS; observed effective cadence: 11.873479 FPS (1.0543% from nominal), inside the analyzer's explicit 2% diagnostic tolerance.
- Ordered frame-set SHA-256: `b0ddf80dccdc1bcad283eb68cd8380633f6d07d3ce1271c8aec14f1d47f86acf`
- Content-crop sequence SHA-256: `9f89beb608bb4503b79d49508ab79060e739c3b33e904f67e56f5575e996911b`
- Audio: ALAC, 48 kHz, stereo, 4658698 bytes, 40.106667 seconds.
- Audio SHA-256: `eb96a4732159c49c907d68949d37fcf8d12d0bf67a9f36347311ba7856a57ddc`
- Decoded PCM SHA-256: `98daa621127a0f6a5d8070f2dcfb64159debb35f793ceeee9c51154188cc4449`; 5556438 nonzero bytes.

## Replay visual diagnostic

- Capture-start terminal-like prefix: ordinals 1–157.
- Reset transition window: ordinals 158–164.
- Reset-like pixel-identical plateau: ordinals 162–164; ordinal 163 is inside it.
- Operator mapping hypothesis: capture ordinals 163–290 contain 128 samples and are proposed as local frames 1–128. The raw capture has no playhead telemetry, and ordinals 162–164 have identical lesson-content pixels, so the exact local-frame mapping is **not proved by this analyzer**.
- Second terminal-like stable suffix: ordinals 406–477; maximum normalized content RMSE to the capture-start terminal-like reference is 0.007484.
- Diagnostic finding: a terminal-like → reset-like → terminal-like visual sequence is established from the pixels and frame order.

## Evidence boundary

- Replay operation causality: **not established**
- Semantic terminal state: **not established**
- Authoritative original-runtime trace/baseline: **false**
- Audio, human visual, and Owner acceptance: **false**
- Strict completion/public release: **false**
- Coverage, candidate, completion-ledger, and release-ledger mutations: **none**
- Report fingerprint: `b6cbf7ca8b0a111e9cc1584318094b91cef09ab80825c4de3f416320607abeb5`
