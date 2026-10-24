// Generated from the two own source audio contracts.
import type {AudioCue} from "../../contract";
export const G4_L5_PRODUCT_POOL_SOURCE_AUDIO = {
  "course-g04-l05-in-015": [
    {
      "id": "source-main",
      "sourceCueId": "sprite-120-original-stream",
      "source": "/lesson-typography-v1/audio/course-g04-l05-in-015/main.mp3",
      "sha256": "17f677fa0c3682fca1a9614a9b0cc0f409589e5f50b2e68042234c2aab1a685d",
      "frame": 5,
      "endFrame": 278,
      "frameDomain": "sprite-120",
      "language": "en",
      "spokenLanguage": "undetermined",
      "scenario": "source-static-frame"
    }
  ],
  "course-g04-l05-in-018": [
    {
      "id": "source-main",
      "sourceCueId": "sprite-107-original-stream",
      "source": "/lesson-typography-v1/audio/course-g04-l05-in-018/main.mp3",
      "sha256": "9c6137e52b8b0168aac40b0734e468f6191c24bd0157f45459bbb2c3579b6cb9",
      "frame": 5,
      "endFrame": 282,
      "frameDomain": "sprite-107",
      "language": "en",
      "spokenLanguage": "undetermined",
      "scenario": "source-static-frame"
    }
  ]
} as const satisfies Readonly<Record<string, readonly (AudioCue & {readonly sha256:string})[]>>;
export const G4_L5_PRODUCT_POOL_HOST_AUDIO = {
  "course-g04-l05-in-015": [
    {
      "id": "course-g04-l05-in-015-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l05-in-015/spanish-host-narration.mp3",
      "sha256": "3f8a2d0b59b6dd32120fce2d18e8a6898207ed5ca1e1e2dac883400939f7bcde",
      "durationMs": 26880,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-120"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ],
  "course-g04-l05-in-018": [
    {
      "id": "course-g04-l05-in-018-spanish-host-narration",
      "label": "Spanish Audio",
      "language": "es",
      "source": "/lesson-typography-v1/audio/course-g04-l05-in-018/spanish-host-narration.mp3",
      "sha256": "7a15bb0a42d8c509d092970a327f258fab964cdf7f9e4eed64e2093304a4fd17",
      "durationMs": 26568,
      "activation": "user",
      "visibleWhen": [
        "es"
      ],
      "frameDomains": [
        "sprite-107"
      ],
      "timelineBehavior": "pause-while-playing"
    }
  ]
} as const;
