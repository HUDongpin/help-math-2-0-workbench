# G4 L3 SWF ADPCM Derived-Audio Technical Binding

> Acceptance-neutral byte-level evidence only. This does not establish language, cue/sync behavior, audible content or quality, listening approval, original-runtime behavior, parity, human/owner acceptance, or strict completion.

## Result

- Raw source: `artifacts/g4-l3-embedded-audio/sha256/e5/e5c99e029d9df7717bc7755b5f4660841ad3f453d10bb8dbc8010d69b5a653b6.bin` (3770 bytes; SHA-256 `e5c99e029d9df7717bc7755b5f4660841ad3f453d10bb8dbc8010d69b5a653b6`).
- Framing: 13 independent SoundStreamBlock ADPCM records × 459 mono samples at 5512 Hz; 5-bit codes.
- Derived WAV: [`artifacts/g4-l3-embedded-audio-derived/sha256/f3/f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8.wav`](../artifacts/g4-l3-embedded-audio-derived/sha256/f3/f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8.wav) (11978 bytes; SHA-256 `f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8`).
- PCM: 5967 samples; raw-data SHA-256 `2fdcd846d6b0f1b99b8d77111a4b5cb58cb1119f76c9b50147d3bf1804548a33`; mathematical duration 1.0825471698113207 seconds.
- Technical probe: ffprobe reported `pcm_s16le`, 5512 Hz, 1 channel, and 5967 decoded samples; ffmpeg decode-to-null passed.
- Immutability: the source CAS remained exact `0444`; the derived artifact is a separate exact `0444` content-addressed file.

## Specification basis

- Adobe Systems Incorporated, [SWF File Format Specification Version 19](https://open-flash.github.io/mirrors/swf-spec-19.pdf), pages 13, 177-178, 186-188.
- Step-size table: 89 entries, SHA-256 `1e9bfc8f235603bff7f8172e449d36b9b23589be8417aec8960e5495120b97b3`.
- 5-bit index table: `[-1,-1,-1,-1,-1,-1,-1,-1,1,2,4,6,8,10,13,16]`, SHA-256 `b171a4122f87e62d131024b5ed338a0b499c3fb20b03ae254056eb72015a5e32`.

## Four source references

| Animation | Frame domain | Stream | Source order | Source SWF SHA-256 |
|---|---|---:|---:|---|
| `course-g04-l03-in-004` | `sprite-84` | 4 | 4 | `2ac5cd71bbc57bd9761668a7c383f821fa52b91f1e68a7b4f14151410857dfad` |
| `course-g04-l03-ti-002` | `sprite-217` | 3 | 3 | `e640f8dcbfb6dd6945d97be67890e0015902702239e2bad4bd4283685fb0f807` |
| `course-g04-l03-ts-008` | `sprite-312` | 10 | 10 | `9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885` |
| `course-g04-l03-vb-008` | `sprite-191` | 10 | 10 | `3c61fd04bbaf6b316438691fd59222623bbb1d11a36c731ae7ed9fb862245bcf` |

## Per-block decode facts

| Block | Source offset | Source block SHA-256 | Initial sample | Initial index | Final sample | Final index | Zero pad bits |
|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | 0 | `91138d92ed669e10208f684f3788e52211d3b98cd6f867893b413bbd17d789e5` | 0 | 0 | 0 | 0 | 6 |
| 2 | 290 | `4700af2f86ba09f7a071e09af4a89d156925174b24d55b8a4853e7009e593ab3` | 0 | 0 | 0 | 0 | 6 |
| 3 | 580 | `153e5496858a6fa838d132111d3612cea05085fee6e88ce94049ac20c2efff70` | 0 | 0 | -10 | 36 | 6 |
| 4 | 870 | `2498d2c867f5044c21267ee9d79649d496d07bf9a27f56e4b34d0c20ad12ccf6` | 0 | 0 | 227 | 46 | 6 |
| 5 | 1160 | `4fc4476f7b40eb035589040b197346f29f6e1ab66a481dea784fcbf5a44a9d19` | 0 | 0 | 505 | 55 | 6 |
| 6 | 1450 | `4da09c1ff4ed4fafaed6d718d7f3cdbe25072a802e01044f56863b0cd0bf62a6` | 0 | 38 | 1590 | 60 | 6 |
| 7 | 1740 | `a4b1a85343058d2d4532b6bb86aee75eb12d08d47a639d60b0159dd008e5ccdf` | -256 | 59 | 184 | 80 | 6 |
| 8 | 2030 | `4b2c857a896173cd2bacaa0bda83f5d694b2acafa298d95487565980d7900c53` | -2304 | 56 | 253 | 77 | 6 |
| 9 | 2320 | `25826caf622342d09760f90b5ccb7fe8a95b857c112f450189eeb2294bf69b55` | -6144 | 63 | -4421 | 75 | 6 |
| 10 | 2610 | `14e6334548c781caa4984604bf6e0fc7d250e972e6a04de25f2f11821d1c8f22` | -1024 | 61 | -2680 | 72 | 6 |
| 11 | 2900 | `417c4918ec2d9ffc49f5b72473308333157ae58071d491eeefeb825223c916a2` | 1536 | 62 | 139 | 60 | 6 |
| 12 | 3190 | `4be693cff01d496672f7695f3f531bdc883accdeb2e03c3dfb6dc54bb0281a75` | 512 | 38 | 241 | 41 | 6 |
| 13 | 3480 | `8208b2f60b21a60cee42f93d16ea2ab64f450b6f8a055aae4d430376cc3baf49` | 0 | 0 | 0 | 0 | 6 |

## Tool bindings

- ffprobe: ffprobe version 8.1.2 Copyright (c) 2007-2026 the FFmpeg developers; executable SHA-256 `cfeefcc9207eb3fa424679228fe3848db2921b15537d26c1ccc4a7a61de95d00`.
- ffmpeg: ffmpeg version 8.1.2 Copyright (c) 2000-2026 the FFmpeg developers; executable SHA-256 `dad4b30b36a1a999bfa4b6ffbde138bd17ee496c69e12eef638227dff2c6415c`.

## Acceptance boundary

This report establishes only deterministic byte-level decoding of one raw SWF ADPCM CAS payload into a separately stored PCM WAV and technical ffprobe/ffmpeg readability. It does not establish spoken language, cue mapping, timeline synchronization, audible content or quality, listening acceptance, authoritative/original-runtime behavior, equality with an independent FFDec/original decoder PCM export, behavioral or visual parity, human review, owner acceptance, or strict migration completion.
