// Generated from own027 source recipe; do not hand edit.
import type{AudioCue,AudioTrack}from"../../contract";
export const G4_L9_TI002_HOST_AUDIO={
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-ti-002-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-ti-002/spanish-host-narration.mp3",
      "sha256": "e55386a7f1f471e3c49c4cc2a42f25513bd32e940bab9e64b480285fe784fd4f",
      "durationMs": 28056,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-380"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
