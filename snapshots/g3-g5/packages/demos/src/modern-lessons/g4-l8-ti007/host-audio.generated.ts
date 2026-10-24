import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_TI007_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-ti-007-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-ti-007/spanish-host-narration.mp3",
      "sha256": "0157130cc8e16e6cd321aee36236fce80fb4debbc5c25c2b075655ef4019b38e",
      "durationMs": 8256,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-149"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
