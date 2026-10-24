import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_TI005_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-ti-005-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-ti-005/spanish-host-narration.mp3",
      "sha256": "76d36d2e862b28cd000e321766dc8b1ed3afee4e78af2fcefb1be97ae9762205",
      "durationMs": 6792,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-141"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
