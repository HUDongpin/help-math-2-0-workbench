import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_IN013_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-in-013-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-in-013/spanish-host-narration.mp3",
      "sha256": "fc0626185995d2d395dc52a3443167dff276d306966a3b671ff9bb7559b19d59",
      "durationMs": 19200,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-64"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
