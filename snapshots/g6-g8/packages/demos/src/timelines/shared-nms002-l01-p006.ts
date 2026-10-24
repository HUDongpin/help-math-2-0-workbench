import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L01_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L1/VB/L1VB02.swf",
    "sha256": "4ad5f233a2625d2d795cd585278abfa232055f36f92906568621698d72c3cedc"
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

export const SHARED_NMS002_L01_P006_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l01-p006",
  "title": "Integers — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "4ad5f233a2625d2d795cd585278abfa232055f36f92906568621698d72c3cedc",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l01-p006/canvas-renderer.js",
  "assetSha256": "a5cfc6b1229783e4f26c76361e85c6b2c9e306f64d8aac1b9fab8641cd3cc6b9",
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
  "mainFrameDomain": "sprite-89",
  "mainFrameCount": 714,
  "livePlaybackEndFrame": 714,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-89-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 714
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
