import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_TI006_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-ti-006-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-ti-006/spanish-host-narration.mp3",
      "sha256": "77a0cd0afac31d48ffd6225d6650e833ee737ff57ff2da505cfe5119b8ff43c1",
      "durationMs": 18864,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-181"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
