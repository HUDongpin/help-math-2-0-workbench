// Source-bound IN006 preparation.
import type{AudioCue,AudioTrack}from'../../contract';
import type{LessonTextActivityDefinition}from'../../lesson-text-contract';
export const IN006_SOURCE_AUDIO=[
  {
    "id": "source-main",
    "sourceCueId": "sprite-195-original-stream",
    "source": "/lesson-typography-v1/audio/course-g04-l05-in-006/main.mp3",
    "sha256": "61ba911176db92ac9064243a7c39f40c4c4a5f557ac638f35ec6dfaf9a7fe146",
    "frame": 12,
    "endFrame": 444,
    "frameDomain": "sprite-195",
    "language": "en",
    "spokenLanguage": "undetermined",
    "scenario": "source-static-frame"
  }
] as const satisfies readonly (AudioCue&{readonly sha256:string})[];
export const IN006_HOST_AUDIO={
  "audioCues": [],
  "audioTracks": [
    {
      "id": "course-g04-l05-in-006-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l05-in-006/spanish-host-narration.mp3",
      "sha256": "2431133555f208ca69be2db9697b0ca2375159fc899cca507e111ffd58e5eab4",
      "durationMs": 28992,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-195"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const satisfies{readonly audioCues:readonly AudioCue[];readonly audioTracks:readonly AudioTrack[]};
export const IN006_ACTIVITIES=[
  {
    "id": "in006-wrong",
    "sourceInstanceId": "sprite-195/depth-114/generation-1",
    "parentLifetime": {
      "firstFrame": 205,
      "lastFrameExclusive": 206
    },
    "frameDomain": "sprite-147",
    "startFrame": 2,
    "endFrame": 15,
    "fps": 12,
    "parentFrames": [
      205
    ],
    "audio": {
      "source": "/lesson-typography-v1/audio/course-g04-l05-in-006/wrong.mp3",
      "sha256": "a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04",
      "language": "en",
      "spokenLanguage": "undetermined",
      "firstFrame": 1,
      "lastFrame": 15,
      "offsetSeconds": 0.07587301587301587
    }
  },
  {
    "id": "in006-close",
    "sourceInstanceId": "sprite-195/depth-114/generation-1/sprite-147/depth-1/generation-1/button-144/record-10",
    "parentLifetime": {
      "firstFrame": 205,
      "lastFrameExclusive": 206
    },
    "buttonPress": {
      "sourceButtonId": 144
    },
    "frameDomain": "sprite-143",
    "startFrame": 1,
    "endFrame": 5,
    "fps": 12,
    "parentFrames": [
      205
    ],
    "audio": {
      "source": "/lesson-typography-v1/audio/course-g04-l05-in-006/close.mp3",
      "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
      "language": "shared",
      "firstFrame": 1,
      "lastFrame": 5,
      "offsetSeconds": 0.07587301587301587
    }
  }
] as const satisfies readonly LessonTextActivityDefinition[];
