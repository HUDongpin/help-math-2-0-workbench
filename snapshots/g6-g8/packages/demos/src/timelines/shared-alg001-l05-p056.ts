import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L05_P056_SOURCE = Object.freeze({
  "calibrationId": "g678-ts04-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L5/TS/L5TS04.swf",
    "sha256": "2a6b1c12f13ee52a191ac0d495111f3a00d68f4e94803c1460a7c7115143c3c7"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts04-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts04-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L05_P056_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l05-p056",
  "title": "4 Step Plan — local-only TS04 Current-JS candidate",
  "sourceSwfSha256": "2a6b1c12f13ee52a191ac0d495111f3a00d68f4e94803c1460a7c7115143c3c7",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l05-p056/canvas-renderer.js",
  "assetSha256": "56c0c873b0a5b98f68f81fa44d08e96ea699eca006f3c922095e05c53bec2744",
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
  "mainFrameDomain": "sprite-36",
  "mainFrameCount": 349,
  "livePlaybackEndFrame": 349,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-36-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 349
    }
  ],
  "sourceControlBehaviorLabel": "TS04 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
