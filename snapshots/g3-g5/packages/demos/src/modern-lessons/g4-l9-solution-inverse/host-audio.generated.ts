// Generated own Solution/Inverse host routing.
import type {AudioCue,AudioTrack}from"../../contract";
export const G4_L9_SOLUTION_INVERSE_HOST_AUDIO = {
  "course-g04-l09-vb-008": {
    "audioCues": [],
    "audioTracks": [
      {
        "id": "course-g04-l09-vb-008-spanish-host-narration",
        "label": "Spanish Audio",
        "language": "es",
        "source": "/lesson-typography-v1/audio/course-g04-l09-vb-008/spanish-host-narration.mp3",
        "sha256": "1298118a885b4197265430a0199484c5288e054278932311464539248e1e5bad",
        "durationMs": 18288,
        "activation": "user",
        "visibleWhen": [
          "es"
        ],
        "frameDomains": [
          "sprite-28"
        ],
        "timelineBehavior": "pause-while-playing"
      }
    ]
  },
  "course-g04-l09-vb-010": {
    "audioCues": [],
    "audioTracks": [
      {
        "id": "course-g04-l09-vb-010-spanish-host-narration",
        "label": "Spanish Audio",
        "language": "es",
        "source": "/lesson-typography-v1/audio/course-g04-l09-vb-010/spanish-host-narration.mp3",
        "sha256": "fd3dd3cac893b3e2ef0d85b2c528ddaed84e9e131cdf7e4da4ae0e50077ccdc9",
        "durationMs": 24024,
        "activation": "user",
        "visibleWhen": [
          "es"
        ],
        "frameDomains": [
          "sprite-41"
        ],
        "timelineBehavior": "pause-while-playing"
      }
    ]
  }
} as const satisfies Readonly<Record<string,{readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]}>>;
