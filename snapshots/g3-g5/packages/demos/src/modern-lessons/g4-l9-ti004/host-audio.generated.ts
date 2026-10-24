// Own source Spanish host routing; spoken language/listening remain unestablished.
import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L9_TI004_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-ti-004-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "spokenLanguage": "undetermined",
      "source": "/lesson-typography-v1/audio/course-g04-l09-ti-004/spanish-host-narration.mp3",
      "sha256": "52fe9807f186b5c50ae485bc1d818551290c59204df7d0dda3783b61321d4810",
      "durationMs": 9696,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-134"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
