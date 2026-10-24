// Generated own VB009 host routing.
import type {AudioCue,AudioTrack}from"../../contract";
export const G4_L9_VB009_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-vb-009-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-vb-009/spanish-host-narration.mp3",
      "sha256": "8d77b766d34dd3f932beb78a71bf5c74cc0f9d4e9c1dd69d47302cc2eacdbccf",
      "durationMs": 8712,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-249"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
