// Generated own G4L9 VB003 host-audio routing.
import type {AudioCue,AudioTrack}from"../../contract";
export const G4_L9_VB003_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-vb-003-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-vb-003/spanish-host-narration.mp3",
      "sha256": "7b049e50ffc56149d12df8a7ccf275a6da8cc8823de85bd849fecb282f95aa32",
      "durationMs": 9408,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-248"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
