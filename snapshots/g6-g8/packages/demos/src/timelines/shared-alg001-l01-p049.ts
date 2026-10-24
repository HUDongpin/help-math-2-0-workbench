import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L01_P049_SOURCE = Object.freeze({
  "calibrationId": "g678-ts04-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L1/TS/L1TS04.swf",
    "sha256": "1cc636b802262f172974ae08148123f32c66a51914eef7b20174fb11562a6f55"
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

export const SHARED_ALG001_L01_P049_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l01-p049",
  "title": "4 Step Plan — local-only TS04 Current-JS candidate",
  "sourceSwfSha256": "1cc636b802262f172974ae08148123f32c66a51914eef7b20174fb11562a6f55",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l01-p049/canvas-renderer.js",
  "assetSha256": "81f53076cf53a6d70e9e9888f62c4f33066928e22934535d6b4524e2cdedd56c",
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
  "mainFrameDomain": "sprite-68",
  "mainFrameCount": 328,
  "livePlaybackEndFrame": 328,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-68-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 328
    }
  ],
  "sourceControlBehaviorLabel": "TS04 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
