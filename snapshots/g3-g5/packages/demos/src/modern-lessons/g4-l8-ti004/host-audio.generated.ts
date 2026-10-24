import type {AudioCue,AudioTrack} from "../../contract";
export const G4_L8_TI004_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l08-ti-004-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l08-ti-004/spanish-host-narration.mp3",
      "sha256": "25186fc784ed527bf8e6a99cde05d55c61e227347dc62706b9f2db8a967fd71f",
      "durationMs": 25104,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-146"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
