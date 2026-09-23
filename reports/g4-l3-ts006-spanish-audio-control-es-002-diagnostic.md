# G4 L3 TS006 Spanish audio-control supplemental diagnostic

Status: **verified pending-candidate diagnostic; no acceptance effect**.

This deterministic report binds and revalidates the supplemental Flash Player capture `spanish-audio-control-es-002`. It records a machine-observed timing association between a control-state change and non-silent system audio. It does not establish a click-to-audio causal chain, a match to L3TS06.mp3, Spanish spoken content, listening acceptance, visual review, Owner acceptance, strict completion, or publication.

## Bound evidence

- Pending candidate SHA-256: `7c59ee39e8b82827c48107bf702630f5438c3626d44258c54477bb7da62b0f10`
- Capture manifest SHA-256: `9ea09d0c172da9571c3a2a1b8d1ff0c23e06165aae86225eb0ed81e776535304`
- Ordered 539-frame set SHA-256: `32bd3a077379b7aab0c0b5f32bdc0cd1500fe3e454af20f0a7f09c5f6b43d5a3`
- Lossless session audio SHA-256: `e4f07700a9bc48876aee780a54a9b8d46ae158d204b6aea809933a6c002f05c7`
- Canonical and staged L3TS06.mp3 SHA-256: `c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688`
- Complete PNG verification: 539/539, 800×600, dropped/incomplete 0
- Requested FPS: 12; effective FPS: 11.908437342
- Session audio: 45.141333 seconds, ALAC 48 kHz stereo, mean/max -26.0 / -5.2 dB

## Control crop

The crop `32x26+766+82` contains exactly three deterministic pixel-signature runs. State names are deliberately limited to what the pixels show.

| Frames | Video-relative seconds | Observed visual state | Crop signature |
|---:|---:|---|---|
| 1-312 | 0.000000-26.111528 | non-pause-control-state | `5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701` |
| 313-494 | 26.194895-41.404350 | pause-icon-visible | `361aeafcc964387d3db68abcd67f5bb289c52f1ee7c48d91892424e1769dec3c` |
| 495-539 | 41.487712-45.178052 | non-pause-control-state | `5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701` |

## Audio silence intervals

| # | Start (audio s) | End (audio s) | Duration (s) |
|---:|---:|---:|---:|
| 1 | 0.000000 | 26.235125 | 26.235125 |
| 2 | 31.435271 | 32.274479 | 0.839208 |
| 3 | 34.490521 | 34.952979 | 0.462458 |
| 4 | 41.417750 | 45.140000 | 3.722250 |

## PTS association

- Audio-to-video PTS-origin offset: 0.021628916 seconds
- Pause visual interval: frames 313-494, 26.194895291-41.404350166 video-relative seconds
- Outer non-silent envelope after PTS mapping: 26.256753916-41.439378916 video-relative seconds
- Start offset from first pause frame: 61.858625 ms
- End offset from last pause frame: 35.028750 ms
- Both offsets are within one nominal 12 FPS frame (83.333333 ms): true

## Fail-closed conclusion

- Hash-chained trigger/event log present: **false**
- Temporal association observed: **true**
- Causal attribution established: **false**
- Flash runtime audio emission established: **false**
- Source-media match established: **false**
- Spanish spoken-language identity established: **false**
- Named-human original-runtime listening accepted: **false**
- Independent human visual review accepted: **false**
- Owner accepted: **false**
- Audio accepted: **false**
- Strict migration complete: **false**
- Strict acceptance effect: **none**

After mapping the audio PTS origin to video-relative time, the outer non-silent envelope begins and ends within one requested 12 FPS frame of the observed pause-icon interval. This is temporal association only; no hash-chained click/event log, media-request proof, isolated application-audio attribution, source waveform match, or listening record exists.
