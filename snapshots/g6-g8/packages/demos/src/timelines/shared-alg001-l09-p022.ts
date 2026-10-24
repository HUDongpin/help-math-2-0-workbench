import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P022_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-in10-choice-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN10.swf",
    "sha256": "257ef18c7bbca00e0e28781b12eb6ccf27b4ad3cd210d8c0a0fa4b0248f397dc"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-in10-choice-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-in10-choice-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P022_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p022",
  "title": "Identifying Relationships as Proportional or Non-Proportional — local-only ALG L9 IN10 choice-quiz Current-JS candidate",
  "sourceSwfSha256": "257ef18c7bbca00e0e28781b12eb6ccf27b4ad3cd210d8c0a0fa4b0248f397dc",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p022/canvas-renderer.js",
  "assetSha256": "ff86ece7e3ac6f50be042e1a9e8d1ee1cafa8a2dc1485048420d570118e1c7c1",
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
  "mainFrameDomain": "sprite-190",
  "mainFrameCount": 436,
  "livePlaybackEndFrame": 436,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-190-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 436
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 IN10 source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
