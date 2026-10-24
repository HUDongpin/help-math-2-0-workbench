import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L05_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L5/VB/L5VB02.swf",
    "sha256": "3522b254e9e0f2fe76c5e4f2904e254827cddb7f7c4afedbdc6d14b7d8893b9e"
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

export const SHARED_ALG001_L05_P005_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l05-p005",
  "title": "Term Review — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "3522b254e9e0f2fe76c5e4f2904e254827cddb7f7c4afedbdc6d14b7d8893b9e",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l05-p005/canvas-renderer.js",
  "assetSha256": "b0776aa411fe205b54d145a5042ca96b74d92e772b3c19a965ff97ccdfc10fc1",
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
  "mainFrameDomain": "sprite-30",
  "mainFrameCount": 636,
  "livePlaybackEndFrame": 636,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-30-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 636
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
