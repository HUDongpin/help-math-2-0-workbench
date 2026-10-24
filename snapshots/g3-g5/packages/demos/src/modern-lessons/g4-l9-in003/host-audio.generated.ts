// Generated own S source host track; routing metadata only.
import type {AudioCue,AudioTrack}from"../../contract";
export const G4_L9_IN003_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-in-003-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-in-003/spanish-host-narration.mp3",
      "sha256": "2dce638c1127956865076edfdf5de26ca46cd17c0d82653d6141f97043aaf7c2",
      "durationMs": 39624,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-35"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
