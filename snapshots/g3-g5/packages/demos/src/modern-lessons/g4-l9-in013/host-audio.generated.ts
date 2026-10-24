// Generated own IN013 source-bound Spanish host routing.
import type{AudioCue,AudioTrack}from"../../contract";
export const G4_L9_IN013_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-in-013-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-in-013/spanish-host-narration.mp3",
      "sha256": "2128fe29527d6dbe9e36deada7ad075129b7d122bf6c70434a9d237d931313ea",
      "durationMs": 14016,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-189"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
