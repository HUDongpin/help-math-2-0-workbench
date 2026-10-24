import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_TI003_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-ti-003-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-ti-003/spanish-host-narration.mp3",
      "sha256": "7f55e32cf8ccd1d9aef6aeb32ec92960a66c2136517cacc5a89d4b246f16caac",
      "durationMs": 15000,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-152"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
