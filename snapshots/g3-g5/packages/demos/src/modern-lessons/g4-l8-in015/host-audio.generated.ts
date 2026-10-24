import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_IN015_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-in-015-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-in-015/spanish-host-narration.mp3",
      "sha256": "fb0417f66d89b6da47e7debb738b73e471f552a2282e5d1169e59461fb51ae9f",
      "durationMs": 18048,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-228"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
