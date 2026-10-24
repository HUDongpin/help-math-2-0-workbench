// Prepared from the exact VB015 source audio; PCM integration remains explicit.
import type {AudioCue, AudioTrack} from '../../contract';
export const VB015_SOURCE_AUDIO = [
  {
    "id": "source-main",
    "sourceCueId": "sprite-32-original-stream",
    "source": "/lesson-typography-v1/audio/course-g04-l05-vb-015/main.mp3",
    "sha256": "1153f5c81915579c0cb5f1b4d42f653e056818bd975ecf8da4dd014be3957b2c",
    "frame": 7,
    "endFrame": 142,
    "frameDomain": "sprite-32",
    "language": "en",
    "spokenLanguage": "undetermined",
    "scenario": "source-static-frame"
  }
] as const satisfies readonly (AudioCue & {readonly sha256:string})[];
export const VB015_HOST_AUDIO = {
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l05-vb-015-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l05-vb-015/spanish-host-narration.mp3",
      "sha256": "3ba121343bda2b89d755ea125d57e90a82eb3701f1f8c114bafc414252ed11b9",
      "durationMs": 15912,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-32"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies {readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
