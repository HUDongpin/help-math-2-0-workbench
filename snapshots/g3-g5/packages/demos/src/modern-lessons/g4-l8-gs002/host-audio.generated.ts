import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_GS002_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-gs-002-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-gs-002/spanish-host-narration.mp3",
      "sha256": "ab0559d18a58d9ee959e71473c9d15ecd441f51fd7941cfd6789010794c7f953",
      "durationMs": 68592,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-219"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
