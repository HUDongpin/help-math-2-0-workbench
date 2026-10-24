import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P052_SOURCE = Object.freeze({
  "calibrationId": "g678-ts03-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/TS/L6TS03.swf",
    "sha256": "09c315a50d053f7623e0d06a9639e59f1ee82568a37184c2f0b77e56b406ebca"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts03-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts03-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L06_P052_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p052",
  "title": "4 Step Plan — local-only TS03 Current-JS candidate",
  "sourceSwfSha256": "09c315a50d053f7623e0d06a9639e59f1ee82568a37184c2f0b77e56b406ebca",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p052/canvas-renderer.js",
  "assetSha256": "d5a3592ce5306405e9893a30b24b222ca84a0a8ac5e1b03e1236d57bda133eee",
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
  "mainFrameDomain": "sprite-25",
  "mainFrameCount": 223,
  "livePlaybackEndFrame": 223,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-25-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 223
    }
  ],
  "sourceControlBehaviorLabel": "TS03 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
