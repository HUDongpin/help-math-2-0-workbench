import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/VB/L3VB02.swf",
    "sha256": "505132e55399b78dc4617d7d9499ddd5365596f71b6cb78b1335ffcf4947a183"
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

export const SHARED_ALG001_L03_P006_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p006",
  "title": "Pattern, Term, Sequence, Rule — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "505132e55399b78dc4617d7d9499ddd5365596f71b6cb78b1335ffcf4947a183",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p006/canvas-renderer.js",
  "assetSha256": "f59d00c8ee12ff40488ddc5299a5e7b3fa722b0cf02a31d1091f3f5f04eb2aba",
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
  "mainFrameDomain": "sprite-51",
  "mainFrameCount": 520,
  "livePlaybackEndFrame": 520,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-51-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 520
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
