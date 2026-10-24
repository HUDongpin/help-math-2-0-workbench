import type {LessonTextActivityDefinition,LessonTextPresentationCapability} from '../../lesson-text-contract';
export const IN008_ACTIVITIES = [
  {
    "fps": 12,
    "parentFrames": [
      216
    ],
    "parentLifetime": {
      "firstFrame": 216,
      "lastFrameExclusive": 218
    },
    "id": "in008-correct-coach",
    "sourceInstanceId": "sprite-57/depth-51/generation-1",
    "frameDomain": "sprite-56",
    "startFrame": 2,
    "endFrame": 20,
    "audio": {
      "source": "/lesson-typography-v1/audio/course-g04-l03-in-006/sprite-146.mp3",
      "sha256": "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
      "language": "shared",
      "spokenLanguage": "undetermined",
      "firstFrame": 2,
      "lastFrame": 20,
      "offsetSeconds": 0.07587301587301587
    }
  },
  {
    "fps": 12,
    "parentFrames": [
      216
    ],
    "parentLifetime": {
      "firstFrame": 216,
      "lastFrameExclusive": 218
    },
    "id": "in008-wrong-s1",
    "sourceInstanceId": "sprite-57/depth-49/generation-1",
    "frameDomain": "sprite-54",
    "startFrame": 3,
    "endFrame": 16,
    "audio": {
      "source": "/lesson-typography-v1/audio/course-g04-l03-in-006/sprite-144.mp3",
      "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf",
      "language": "shared",
      "spokenLanguage": "undetermined",
      "firstFrame": 3,
      "lastFrame": 16,
      "offsetSeconds": 0.07587301587301587
    }
  },
  {
    "fps": 12,
    "parentFrames": [
      216
    ],
    "parentLifetime": {
      "firstFrame": 216,
      "lastFrameExclusive": 218
    },
    "id": "in008-wrong-s2",
    "sourceInstanceId": "sprite-57/depth-49/generation-1",
    "frameDomain": "sprite-54",
    "startFrame": 18,
    "endFrame": 27,
    "audio": {
      "source": "/lesson-typography-v1/audio/course-g04-l03-in-006/sprite-144.mp3",
      "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf",
      "language": "shared",
      "spokenLanguage": "undetermined",
      "firstFrame": 18,
      "lastFrame": 27,
      "offsetSeconds": 1.2422222222222221
    }
  },
  {
    "fps": 12,
    "parentFrames": [
      216
    ],
    "parentLifetime": {
      "firstFrame": 216,
      "lastFrameExclusive": 218
    },
    "id": "in008-wrong-s3",
    "sourceInstanceId": "sprite-57/depth-49/generation-1",
    "frameDomain": "sprite-54",
    "startFrame": 31,
    "endFrame": 36,
    "audio": {
      "source": "/lesson-typography-v1/audio/course-g04-l03-in-006/sprite-144.mp3",
      "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf",
      "language": "shared",
      "spokenLanguage": "undetermined",
      "firstFrame": 31,
      "lastFrame": 36,
      "offsetSeconds": 2.325260770975057
    }
  },
  {
    "fps": 12,
    "parentFrames": [
      216
    ],
    "parentLifetime": {
      "firstFrame": 216,
      "lastFrameExclusive": 218
    },
    "id": "in008-wrong-s4",
    "sourceInstanceId": "sprite-57/depth-49/generation-1",
    "frameDomain": "sprite-54",
    "startFrame": 40,
    "endFrame": 54,
    "audio": {
      "source": "/lesson-typography-v1/audio/course-g04-l03-in-006/sprite-144.mp3",
      "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf",
      "language": "shared",
      "spokenLanguage": "undetermined",
      "firstFrame": 40,
      "lastFrame": 54,
      "offsetSeconds": 3.0750566893424036
    }
  },
  {
    "fps": 12,
    "parentFrames": [
      216
    ],
    "parentLifetime": {
      "firstFrame": 216,
      "lastFrameExclusive": 218
    },
    "id": "in008-close-down",
    "sourceInstanceId": "sprite-57/depth-38/generation-1/sprite-52/depth-1/generation-1/button-49/record-10",
    "frameDomain": "sprite-48",
    "startFrame": 1,
    "endFrame": 5,
    "audio": {
      "source": "/lesson-typography-v1/audio/course-g04-l03-in-006/sprite-34.mp3",
      "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
      "language": "shared",
      "spokenLanguage": "undetermined",
      "firstFrame": 1,
      "lastFrame": 5,
      "offsetSeconds": 0.07587301587301587
    },
    "buttonPress": {
      "sourceButtonId": 49
    }
  }
] as const satisfies readonly LessonTextActivityDefinition[];
export const IN008_AUDIO_HOST = {
...{
  "sourceTimelineAudioCues": [
    {
      "id": "in008-source-main",
      "source": "/flash-assets/courses/course-g04-l03-in-008/audio/embedded-stream-0001.mp3",
      "sha256": "f977f3b49c6c2f01fbff1f78a2f8f8f67a92a5f05957c2a1c4ca58fd0abf6a8c",
      "frame": 2,
      "endFrame": 217,
      "frameDomain": "sprite-57",
      "language": "en",
      "spokenLanguage": "undetermined"
    }
  ],
  "playbackEndFrameByDomain": {
    "sprite-57": 216
  },
  "reducedMotionFrameByDomain": {
    "sprite-57": 216
  },
  "frameControl": {
    "frameDomain": "sprite-57",
    "completionFrame": 216,
    "transitions": []
  }
}, activityTimelines: IN008_ACTIVITIES
} as const satisfies Pick<LessonTextPresentationCapability<unknown>, 'sourceTimelineAudioCues'|'playbackEndFrameByDomain'|'reducedMotionFrameByDomain'|'frameControl'|'activityTimelines'>;
