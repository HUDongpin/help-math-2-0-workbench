// Generated own IN009 Spanish routing.
import type{AudioCue,AudioTrack}from"../../contract";
export const G4_L9_IN009_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-in-009-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-in-009/spanish-host-narration.mp3",
      "sha256": "7e33b910db6e222fc2ab0d915394626ad71ee2f685c57f231a11655c0b58a1b7",
      "durationMs": 25752,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-77"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies{readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
