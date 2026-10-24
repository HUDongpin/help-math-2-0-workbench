import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L01_P008_SOURCE = Object.freeze({
  "calibrationId": "g678-vb03-l1-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L1/VB/L1VB03.swf",
    "sha256": "55d0a2e786bbfd3f4257b6b428b6b92407f0d486778be10b5b445cf12579e1ce"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "vb03-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "vb03-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L01_P008_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l01-p008",
  "title": "Graph as Chart/Table Review — local-only VB-3 Current-JS candidate",
  "sourceSwfSha256": "55d0a2e786bbfd3f4257b6b428b6b92407f0d486778be10b5b445cf12579e1ce",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l01-p008/canvas-renderer.js",
  "assetSha256": "bc89c5ca75160fc69fcf38c7fe4e8d1af3f5af3abb3f2411a26e75972a41f832",
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
  "mainFrameDomain": "sprite-64",
  "mainFrameCount": 48,
  "livePlaybackEndFrame": 48,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-64-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 48
    }
  ],
  "sourceControlBehaviorLabel": "VB-3 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
