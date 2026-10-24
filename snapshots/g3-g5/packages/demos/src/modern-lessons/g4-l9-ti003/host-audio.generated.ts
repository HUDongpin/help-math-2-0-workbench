// Exact own source Spanish host routing; spoken language/listening remain unestablished.
import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L9_TI003_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-ti-003-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "spokenLanguage": "undetermined",
      "source": "/lesson-typography-v1/audio/course-g04-l09-ti-003/spanish-host-narration.mp3",
      "sha256": "37365857b710eef76a3ac3bf2c9e86936dcecf3d61f48d6981ef71b444273e67",
      "durationMs": 58104,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-502"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
