import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_IN009_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-in-009-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-in-009/spanish-host-narration.mp3",
      "sha256": "d28757eaf4e9dd3d9180087a9479aa79045f925d3cb5be1eb1df2acb2544fad4",
      "durationMs": 39000,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-30"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
