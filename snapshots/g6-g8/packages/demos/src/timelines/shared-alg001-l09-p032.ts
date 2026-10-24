import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P032_SOURCE = Object.freeze({
  "calibrationId": "g678-ts02-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS02.swf",
    "sha256": "fc7c02f8f97fd3b4401836458391a9b4b72816f38641ece07c48ae3f2420c649"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P032_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p032",
  "title": "4 Step Plan — local-only TS02 Current-JS candidate",
  "sourceSwfSha256": "fc7c02f8f97fd3b4401836458391a9b4b72816f38641ece07c48ae3f2420c649",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p032/canvas-renderer.js",
  "assetSha256": "60ed03346e06eb43e35a92d7dcfdc64dbde533e2fbe25e8c7211efa0c31aca4c",
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
  "mainFrameDomain": "sprite-26",
  "mainFrameCount": 340,
  "livePlaybackEndFrame": 340,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-26-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 340
    }
  ],
  "sourceControlBehaviorLabel": "TS02 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
