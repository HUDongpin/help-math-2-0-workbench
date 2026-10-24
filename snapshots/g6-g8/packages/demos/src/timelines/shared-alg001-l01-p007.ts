import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L01_P007_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L1/VB/L1VB02.swf",
    "sha256": "55543e91b6244852a49fbb45757a7aaf90e59d03e7e01506c928290782c8eb5f"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "vb02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "vb02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L01_P007_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l01-p007",
  "title": "Graph Review — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "55543e91b6244852a49fbb45757a7aaf90e59d03e7e01506c928290782c8eb5f",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l01-p007/canvas-renderer.js",
  "assetSha256": "d724ca0ad17ea7009a382cc4d838d50011144755d9a90d014d1b1d4aaf04352b",
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
  "mainFrameDomain": "sprite-91",
  "mainFrameCount": 210,
  "livePlaybackEndFrame": 210,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-91-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 210
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
