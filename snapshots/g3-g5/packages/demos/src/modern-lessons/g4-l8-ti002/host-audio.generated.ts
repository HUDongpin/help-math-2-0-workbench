import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_TI002_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-ti-002-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-ti-002/spanish-host-narration.mp3",
      "sha256": "7e91c5cc36cc98c188087b37cd5b368e7a5a073cdd57d42859586326bf5004d6",
      "durationMs": 28896,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-378"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
