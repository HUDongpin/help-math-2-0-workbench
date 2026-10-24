// Generated own IN011 source-bound Spanish host routing.
import type{AudioCue,AudioTrack}from"../../contract";
export const G4_L9_IN011_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l09-in-011-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l09-in-011/spanish-host-narration.mp3",
      "sha256": "85715a926d84223ea06ed17a2108a51743758216df584c0240b06a0468b21eba",
      "durationMs": 8256,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-188"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
