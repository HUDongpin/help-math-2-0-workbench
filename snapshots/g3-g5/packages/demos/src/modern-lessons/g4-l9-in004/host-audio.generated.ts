// Exact source Spanish host routing; spoken language/listening remain unestablished.
import type {AudioCue,AudioTrack}from"../../contract";
export const G4_L9_IN004_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-in-004-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "spokenLanguage": "undetermined",
      "source": "/lesson-typography-v1/audio/course-g04-l09-in-004/spanish-host-narration.mp3",
      "sha256": "1a775697f6c0f5edd2528d6597f38cf7967347d48dfdecf1b7f5d3f94104882f",
      "durationMs": 53376,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-405"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
