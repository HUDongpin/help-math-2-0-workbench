// Generated own G4L9 VB006 host-audio routing.
import type {AudioCue,AudioTrack}from"../../contract";
export const G4_L9_VB006_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-vb-006-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-vb-006/spanish-host-narration.mp3",
      "sha256": "942a7901409d6746d4d01fc0f9158c31fdf433aed63ef1424ed50a7977357dde",
      "durationMs": 10224,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-236"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
