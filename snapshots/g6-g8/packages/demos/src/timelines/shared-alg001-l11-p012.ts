import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P012_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN02.swf",
    "sha256": "ec1ff5252737e2d56d85b7c3c799679b8ad5654fb0539d62c9d34e5ceff5845b"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "in02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "in02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L11_P012_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p012",
  "title": "Inequality Definition — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "ec1ff5252737e2d56d85b7c3c799679b8ad5654fb0539d62c9d34e5ceff5845b",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p012/canvas-renderer.js",
  "assetSha256": "c05b2944c88b88e83178413fa516ff7a1d63851289acf8dc9a9492ebbd1f9f6d",
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
  "mainFrameDomain": "sprite-42",
  "mainFrameCount": 668,
  "livePlaybackEndFrame": 668,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-42-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 668
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
