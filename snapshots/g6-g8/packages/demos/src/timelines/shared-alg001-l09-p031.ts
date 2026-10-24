import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P031_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-game-assessment-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/GS/L9GS03.swf",
    "sha256": "1ede8bbaa6a64ac2428d5a4dd9d03cdd6ca346621210f2001ea32b9210826adb"
  },
  "reviewedLane": "behavior-heavy",
  "adapterFamily": "advanced-manual-alg-l09-matching-game-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-game-assessment-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P031_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p031",
  "title": "Game 2 — local-only ALG L9 game assessment Current-JS candidate",
  "sourceSwfSha256": "1ede8bbaa6a64ac2428d5a4dd9d03cdd6ca346621210f2001ea32b9210826adb",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p031/canvas-renderer.js",
  "assetSha256": "9a0411301ca6a53168ff141df0dbcdbe48b8d2cc32e2fb3970b236b85c01ca2c",
  "stage": {
    "width": 800,
    "height": 600,
    "backgroundColor": "#b8d8f7"
  },
  "nativeStage": {
    "width": 800,
    "height": 600,
    "backgroundColor": "#b8d8f7"
  },
  "backingStage": {
    "width": 800,
    "height": 600
  },
  "fps": 12,
  "rootFrameCount": 10,
  "rootBeginFrame": 6,
  "mainFrameDomain": "sprite-227",
  "mainFrameCount": 5,
  "livePlaybackEndFrame": 5,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-227-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 5
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-game/assessment candidate awaiting browser product calibration; feedback/audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
