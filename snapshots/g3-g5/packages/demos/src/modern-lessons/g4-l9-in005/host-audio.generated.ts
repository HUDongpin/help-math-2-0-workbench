// Generated ownIN005source-bound Spanishhostrouting.
import type{AudioCue,AudioTrack}from"../../contract";
export const G4_L9_IN005_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-in-005-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-in-005/spanish-host-narration.mp3",
      "sha256": "7d1c540b83f45752c9cf435293be0b200bca14e71e4d7c2b01fd0104f2801db6",
      "durationMs": 5688,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-187"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
