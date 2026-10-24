import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L10_P007_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L10/VB/L10VB02.swf",
    "sha256": "64acc290ff3b6b496b65ae54e6889bc180c1235e33e91ca9bfe07d8b8d1536cc"
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

export const SHARED_ALG001_L10_P007_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l10-p007",
  "title": "Power/Exponent Review — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "64acc290ff3b6b496b65ae54e6889bc180c1235e33e91ca9bfe07d8b8d1536cc",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l10-p007/canvas-renderer.js",
  "assetSha256": "9bdcf42a7f5f6f7980c725f96290b810823739a36e99d974d19367840331e0db",
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
  "mainFrameDomain": "sprite-29",
  "mainFrameCount": 326,
  "livePlaybackEndFrame": 326,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-29-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 326
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
