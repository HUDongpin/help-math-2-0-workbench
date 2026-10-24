import type {LessonTextPresentationCapability} from '../../lesson-text-contract';
/** Work proposal only. Source-local MP3 URLs require future materialization; PCM entries already exist for all four feedback hashes. */
export const IN010_AUDIO_HOST = {
  "sourceTimelineAudioCues": [
    {
      "id": "in010-source-main",
      "sourceCueId": "embedded-stream-0001",
      "source": "/flash-assets/courses/course-g04-l03-in-010/audio/embedded-stream-0001.mp3",
      "sha256": "d20018a0addcf4a0b2802f3de47af8498c707ff6448f365a7d70479d2eae42fd",
      "frame": 3,
      "endFrame": 265,
      "frameDomain": "sprite-90",
      "language": "en",
      "spokenLanguage": "undetermined"
    }
  ],
  "playbackEndFrameByDomain": {
    "sprite-90": 264
  },
  "reducedMotionFrameByDomain": {
    "sprite-90": 264
  },
  "frameControl": {
    "frameDomain": "sprite-90",
    "completionFrame": 264,
    "transitions": []
  },
  "completion": {
    "id": "in010-six-card-complete",
    "frameDomain": "sprite-90",
    "frames": [
      264
    ]
  },
  "activityTimelines": [
    {
      "id": "in010-correct-coach",
      "sourceInstanceId": "sprite-90/depth-114/generation-1",
      "parentLifetime": {
        "firstFrame": 264,
        "lastFrameExclusive": 265
      },
      "frameDomain": "sprite-89",
      "startFrame": 2,
      "endFrame": 20,
      "fps": 12,
      "parentFrames": [
        264
      ],
      "audio": {
        "source": "/lesson-typography-v1/audio/course-g04-l03-in-010/sprite-89.mp3",
        "sha256": "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
        "language": "shared",
        "spokenLanguage": "undetermined",
        "firstFrame": 2,
        "lastFrame": 20,
        "offsetSeconds": 0.07587301587301587
      }
    },
    {
      "id": "in010-wrong-popup",
      "sourceInstanceId": "sprite-90/depth-103/generation-1",
      "parentLifetime": {
        "firstFrame": 264,
        "lastFrameExclusive": 265
      },
      "frameDomain": "sprite-87",
      "startFrame": 2,
      "endFrame": 15,
      "fps": 12,
      "parentFrames": [
        264
      ],
      "audio": {
        "source": "/lesson-typography-v1/audio/course-g04-l03-in-010/sprite-87.mp3",
        "sha256": "a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04",
        "language": "shared",
        "spokenLanguage": "undetermined",
        "firstFrame": 1,
        "lastFrame": 15,
        "offsetSeconds": 0.07587301587301587
      }
    },
    {
      "id": "in010-final-feedback",
      "sourceInstanceId": "sprite-90/depth-56/generation-1",
      "parentLifetime": {
        "firstFrame": 264,
        "lastFrameExclusive": 265
      },
      "frameDomain": "sprite-52",
      "startFrame": 2,
      "endFrame": 25,
      "fps": 12,
      "parentFrames": [
        264
      ],
      "audio": {
        "source": "/lesson-typography-v1/audio/course-g04-l03-in-010/sprite-52.mp3",
        "sha256": "b2c63dbaf7304c2c1042dda5e0ee305284f5136c275d6bc8e3e1fcdb552c99a5",
        "language": "shared",
        "spokenLanguage": "undetermined",
        "firstFrame": 2,
        "lastFrame": 25,
        "offsetSeconds": 0.07587301587301587
      }
    },
    {
      "id": "in010-close-down",
      "sourceInstanceId": "sprite-90/depth-103/generation-1/sprite-87/depth-1/generation-1/button-84/record-10",
      "parentLifetime": {
        "firstFrame": 264,
        "lastFrameExclusive": 265
      },
      "frameDomain": "sprite-83",
      "startFrame": 1,
      "endFrame": 5,
      "fps": 12,
      "parentFrames": [
        264
      ],
      "audio": {
        "source": "/lesson-typography-v1/audio/course-g04-l03-in-010/sprite-83.mp3",
        "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
        "language": "shared",
        "spokenLanguage": "undetermined",
        "firstFrame": 1,
        "lastFrame": 5,
        "offsetSeconds": 0.07587301587301587
      },
      "buttonPress": {
        "sourceButtonId": 84
      }
    }
  ]
} as const satisfies Pick<LessonTextPresentationCapability<unknown>,'sourceTimelineAudioCues'|'playbackEndFrameByDomain'|'reducedMotionFrameByDomain'|'frameControl'|'completion'|'activityTimelines'>;
