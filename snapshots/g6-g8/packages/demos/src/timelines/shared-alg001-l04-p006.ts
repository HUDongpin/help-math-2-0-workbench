import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L04_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L4/VB/L4VB02.swf",
    "sha256": "eb5dff67db6ba79a6ff3396ade9ae31049f7c8b6fda909df31f395c75551a1c6"
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

export const SHARED_ALG001_L04_P006_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l04-p006",
  "title": "Relationship — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "eb5dff67db6ba79a6ff3396ade9ae31049f7c8b6fda909df31f395c75551a1c6",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l04-p006/canvas-renderer.js",
  "assetSha256": "646d97419f0a813c3e07c1eccdaaf71bbbb4857a960545edc6a7bca5e04b0cab",
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
  "mainFrameDomain": "sprite-41",
  "mainFrameCount": 581,
  "livePlaybackEndFrame": 581,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-41-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 581
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
