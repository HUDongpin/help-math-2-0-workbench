// Generated own VB011 host routing.
import type{AudioCue,AudioTrack}from"../../contract";
export const G4_L9_VB011_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-vb-011-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-vb-011/spanish-host-narration.mp3",
      "sha256": "63e1e74bea6d25a4bfad6d7a1f0b351366c905ee4353fd6de5ca09742e6eb236",
      "durationMs": 20664,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-33"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
