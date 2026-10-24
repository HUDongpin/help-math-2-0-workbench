// Generated own S source host track; routing metadata only.
import type {AudioCue,AudioTrack}from"../../contract";
export const G4_L9_IN002_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-in-002-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-in-002/spanish-host-narration.mp3",
      "sha256": "05a4fadafb5d1a7a306f705e393b9a3ddad605a29fd2bddd61d815becc08dc03",
      "durationMs": 16560,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-36"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
