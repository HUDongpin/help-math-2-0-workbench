// Generated from the pinned IN008 audio preparation.
import type {AudioCue,AudioTrack}from'../../contract';
export const G4_L8_IN008_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-in-008-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-in-008/spanish-host-narration.mp3",
      "sha256": "d1c2e0b4fc55e2ae4d712aff714ac677083ae4ade393907434d9bb0209e6394d",
      "durationMs": 20928,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-131"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
