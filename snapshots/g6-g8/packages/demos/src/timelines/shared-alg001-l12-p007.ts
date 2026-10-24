import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P007_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/VB/L12VB02.swf",
    "sha256": "e978cc188a1d62c86c327131d10d6b885fd7c97106c0f0da8057a5e0a1186c2a"
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

export const SHARED_ALG001_L12_P007_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p007",
  "title": "Coordinate Plane — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "e978cc188a1d62c86c327131d10d6b885fd7c97106c0f0da8057a5e0a1186c2a",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p007/canvas-renderer.js",
  "assetSha256": "891f1329daed97a9399e2439ddf06ff7f52c65c7694292b636cb2da63317393d",
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
  "mainFrameDomain": "sprite-55",
  "mainFrameCount": 268,
  "livePlaybackEndFrame": 268,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-55-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 268
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
