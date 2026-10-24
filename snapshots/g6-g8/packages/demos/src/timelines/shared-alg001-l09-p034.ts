import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P034_SOURCE = Object.freeze({
  "calibrationId": "g678-ts04-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS04.swf",
    "sha256": "995d23d806c57d93cfacf78f2654763b41089c9197228479b80316e1206664fe"
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

export const SHARED_ALG001_L09_P034_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p034",
  "title": "4 Step Plan — local-only TS04 Current-JS candidate",
  "sourceSwfSha256": "995d23d806c57d93cfacf78f2654763b41089c9197228479b80316e1206664fe",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p034/canvas-renderer.js",
  "assetSha256": "3d40624b5c11fb42b9122cf6c332204b18330872a6ed1df51282dbc177a405b1",
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
