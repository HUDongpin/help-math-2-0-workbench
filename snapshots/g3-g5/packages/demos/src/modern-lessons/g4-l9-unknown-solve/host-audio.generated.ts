// Generated own G4L9 Unknown-value/Solve source.
import type {AudioCue,AudioTrack}from"../../contract";
export const G4_L9_UNKNOWN_SOLVE_HOST_AUDIO = {
  "course-g04-l09-vb-005": {
    "audioCues": [],
    "audioTracks": [
      {
        "id": "course-g04-l09-vb-005-spanish-host-narration",
        "label": "Spanish Audio",
        "language": "es",
        "source": "/lesson-typography-v1/audio/course-g04-l09-vb-005/spanish-host-narration.mp3",
        "sha256": "7b137b372561d7b7169a87b2b370266a1ce8cf372965131aac1d6d3d3aac12ec",
        "durationMs": 25296,
        "activation": "user",
        "visibleWhen": [
          "es"
        ],
        "frameDomains": [
          "sprite-31"
        ],
        "timelineBehavior": "pause-while-playing"
      }
    ]
  },
  "course-g04-l09-vb-007": {
    "audioCues": [],
    "audioTracks": [
      {
        "id": "course-g04-l09-vb-007-spanish-host-narration",
        "label": "Spanish Audio",
        "language": "es",
        "source": "/lesson-typography-v1/audio/course-g04-l09-vb-007/spanish-host-narration.mp3",
        "sha256": "e5364b1feee8cbbf2f21a33f3df4cc9db26f0d1945668a1affa4be5b655494b8",
        "durationMs": 17520,
        "activation": "user",
        "visibleWhen": [
          "es"
        ],
        "frameDomains": [
          "sprite-29"
        ],
        "timelineBehavior": "pause-while-playing"
      }
    ]
  }
} as const satisfies Readonly<Record<string,{readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]}>>;
