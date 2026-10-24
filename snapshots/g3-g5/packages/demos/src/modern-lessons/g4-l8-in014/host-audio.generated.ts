import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_IN014_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-in-014-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-in-014/spanish-host-narration.mp3",
      "sha256": "0455299611e0fcd6acaf8e7baea6c055f5cf695be63b53be9fd50cc59929b935",
      "durationMs": 33504,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-123"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
