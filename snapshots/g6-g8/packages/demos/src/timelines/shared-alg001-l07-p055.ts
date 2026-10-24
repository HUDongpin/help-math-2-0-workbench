import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L07_P055_SOURCE = Object.freeze({
  "calibrationId": "g678-ts04-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L7/TS/L7TS04.swf",
    "sha256": "5e07cb1e60d26d1b44a7086accce6439bf04e1e645e3b81c9ddcfedf6c71469c"
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

export const SHARED_ALG001_L07_P055_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l07-p055",
  "title": "4 Step Plan — local-only TS04 Current-JS candidate",
  "sourceSwfSha256": "5e07cb1e60d26d1b44a7086accce6439bf04e1e645e3b81c9ddcfedf6c71469c",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l07-p055/canvas-renderer.js",
  "assetSha256": "35292609f5d43f6d124448a94c8aa6713492c1c62fa34e88f8132af743428c52",
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
  "mainFrameCount": 282,
  "livePlaybackEndFrame": 282,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-36-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 282
    }
  ],
  "sourceControlBehaviorLabel": "TS04 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
