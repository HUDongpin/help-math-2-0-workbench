# G4 L3 Runtime Capture System-Audio Calibration

This deterministic report proves only that the exact current ScreenCaptureKit capture-tool build recorded non-zero system-audio buffers and encoded non-silent ALAC while filtering the exact QuickTime Player application in the bound calibration session.

## Result

- System-audio capture calibration: **true**
- Complete frames: 144; dropped/incomplete: 0
- Input payload/non-zero bytes: 4638720 / 832554
- Encoded ALAC decoded PCM/non-zero bytes: 4638720 / 593196
- Encoded ALAC mean/max: -27.7 / -5.5 dB
- Bound source MP3 mean/max: -21.0 / -4.7 dB
- Full-frame set SHA-256: `875dbcd5e42c39dda70e2edcf2a02c91ea7ec9da1c7782df403c52c5d221a724`

## Authority boundary

Calibration success does **not** establish Flash Player audio, spoken Spanish identity, cue timing, listening review, an authoritative baseline, runtime authority, audio acceptance, human review, Owner acceptance, strict completion, or public release. Every one of those fields remains false, and strict-acceptance effect is **none**.

The earlier bound TS006 Spanish-audio diagnostic remains a contrast-only observation: its captured audio was digital silence. This calibration used the current instrumented capture-tool build and therefore does not retroactively validate the older Flash session or determine why that session was silent.

Report fingerprint: `3591b209d397593940ac534f0b844f7c62d3bf546e5bef4b8cf37d9fb6e67284`
