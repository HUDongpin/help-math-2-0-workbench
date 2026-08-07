# G4 L3 Embedded-Audio Byte Archive

> Acceptance-neutral source forensics only. Language, cue mapping, runtime synchronization, listening, human/owner approval, parity, and strict completion remain unresolved.

## Result

- Scope: 40 canonical items (39 active pages + one shell); all 40 SWFs were physically rehashed.
- Parsed: 5 DefineSound records and 354 distinct SoundStream heads (160 SoundStreamHead + 194 SoundStreamHead2), containing 14718 ordered blocks.
- References and identities: 359 source audio-unit references resolve to 90 logical payload structures and 88 byte-identical CAS objects. Logical identity includes the codec/head and ordered block-wrapper layout; CAS identity is the archived payload SHA-256.
- Preflight: 5710816 unique CAS bytes in 88 content-addressed objects, below the 1073741824 byte cap: yes.
- Disposition: content-addressed-archive-written-and-physically-verified; archive-set SHA-256 `5e5f16014945570eee0f4e0b5b9f38a0ccbcb1f1af84ba51fd5c6ed994f8c922`.
- Payload handling: codec bytes were copied without decoding or recompression. MP3 DefineSound SeekSamples and every MP3 SoundStreamBlock sample-count/seek header remain explicit in the JSON report, together with source order, frame, tag header, byte range, and SHA-256.

A SoundStream is not a DefineSound: each stream is keyed by its own SoundStreamHead/Head2 and timeline domain, while its SoundStreamBlock payloads remain in exact source order with contiguous archive byte offsets.

## Per-item inventory

| # | Batch | Animation | DefineSound | Streams | Blocks | Payload bytes | SWF rehash |
|---:|---|---|---:|---:|---:|---:|---|
| 1 | batch-001 | `course-g04-l03-ir-001-341242cc` | 0 | 2 | 270 | 134160 | yes |
| 2 | batch-001 | `course-g04-l03-rw-002` | 0 | 1 | 1286 | 319566 | yes |
| 3 | batch-001 | `course-g04-l03-rw-003` | 0 | 1 | 271 | 112190 | yes |
| 4 | batch-001 | `course-g04-l03-rw-004` | 0 | 1 | 437 | 181090 | yes |
| 5 | batch-001 | `course-g04-l03-vb-002` | 0 | 1 | 187 | 77480 | yes |
| 6 | batch-001 | `course-g04-l03-vb-003` | 0 | 4 | 195 | 80470 | yes |
| 7 | batch-001 | `course-g04-l03-vb-004` | 0 | 1 | 228 | 93990 | yes |
| 8 | batch-001 | `course-g04-l03-vb-005` | 0 | 1 | 174 | 72020 | yes |
| 9 | batch-001 | `course-g04-l03-vb-006` | 0 | 1 | 157 | 65000 | yes |
| 10 | batch-001 | `course-g04-l03-vb-007` | 0 | 11 | 307 | 125320 | yes |
| 11 | batch-001 | `course-g04-l03-vb-008` | 0 | 11 | 291 | 117130 | yes |
| 12 | batch-001 | `course-g04-l03-vb-009` | 0 | 1 | 140 | 57460 | yes |
| 13 | batch-001 | `course-g04-l03-in-002` | 0 | 1 | 486 | 200980 | yes |
| 14 | batch-001 | `course-g04-l03-in-003` | 0 | 1 | 442 | 182390 | yes |
| 15 | batch-001 | `course-g04-l03-in-004` | 0 | 11 | 406 | 165230 | yes |
| 16 | batch-001 | `course-g04-l03-in-005` | 0 | 4 | 206 | 84630 | yes |
| 17 | batch-001 | `course-g04-l03-in-006` | 0 | 5 | 1136 | 470470 | yes |
| 18 | batch-001 | `course-g04-l03-in-007` | 0 | 1 | 555 | 229970 | yes |
| 19 | batch-001 | `course-g04-l03-in-008` | 0 | 4 | 293 | 121030 | yes |
| 20 | batch-001 | `course-g04-l03-in-009` | 0 | 1 | 588 | 243360 | yes |
| 21 | batch-001 | `course-g04-l03-in-010` | 0 | 5 | 325 | 134290 | yes |
| 22 | batch-001 | `course-g04-l03-in-011` | 0 | 1 | 439 | 181870 | yes |
| 23 | batch-001 | `course-g04-l03-in-012` | 0 | 9 | 380 | 156260 | yes |
| 24 | batch-001 | `course-g04-l03-ti-002` | 0 | 9 | 437 | 178750 | yes |
| 25 | batch-001 | `course-g04-l03-ti-003` | 1 | 23 | 97 | 108925 | yes |
| 26 | batch-002 | `course-g04-l03-ti-004` | 0 | 7 | 247 | 101660 | yes |
| 27 | batch-002 | `course-g04-l03-ti-005` | 0 | 6 | 292 | 120380 | yes |
| 28 | batch-002 | `course-g04-l03-ti-006` | 0 | 7 | 289 | 119080 | yes |
| 29 | batch-002 | `course-g04-l03-gs-002` | 0 | 6 | 655 | 270920 | yes |
| 30 | batch-002 | `course-g04-l03-ts-002` | 0 | 1 | 355 | 147030 | yes |
| 31 | batch-002 | `course-g04-l03-ts-003` | 0 | 1 | 236 | 97760 | yes |
| 32 | batch-002 | `course-g04-l03-ts-004` | 0 | 1 | 331 | 137150 | yes |
| 33 | batch-002 | `course-g04-l03-ts-005` | 0 | 1 | 275 | 113880 | yes |
| 34 | batch-002 | `course-g04-l03-ts-006` | 0 | 1 | 128 | 52910 | yes |
| 35 | batch-002 | `course-g04-l03-ts-007` | 0 | 12 | 1004 | 417846 | yes |
| 36 | batch-002 | `course-g04-l03-ts-008` | 0 | 12 | 1082 | 444600 | yes |
| 37 | batch-002 | `course-g04-l03-fq-001` | 0 | 0 | 0 | 0 | yes |
| 38 | batch-002 | `course-g04-l03-fq-002` | 0 | 0 | 0 | 0 | yes |
| 39 | batch-002 | `course-g04-l03-fq-003` | 0 | 0 | 0 | 0 | yes |
| 40 | batch-002 | `shell-course-g04-l03-index-local` | 4 | 188 | 91 | 435639 | yes |

## Acceptance boundary

This report proves only deterministic byte-exact inventory/extraction of SWF-embedded codec payloads. Language, cue mapping, audible content/quality, runtime timing/synchronization, authoritative playback, human review, owner acceptance, parity, and strict migration completion remain unresolved.
