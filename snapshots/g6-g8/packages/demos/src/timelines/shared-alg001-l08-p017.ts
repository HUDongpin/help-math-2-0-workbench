import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L08_P017_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L8/IN/L8IN02.swf",
    "sha256": "c5361125b63640b4a6bb15b5102a7c0efdb6f48d3e34bdeb9e01e773ca35c8aa"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "in02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "in02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L08_P017_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l08-p017",
  "title": "Identifying Linear Equations — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "c5361125b63640b4a6bb15b5102a7c0efdb6f48d3e34bdeb9e01e773ca35c8aa",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l08-p017/canvas-renderer.js",
  "assetSha256": "a3f5839550f83c9a1fadfa9318325d0c2328d22ac38d10b9e292f28d9eb6d723",
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
  "mainFrameDomain": "sprite-46",
  "mainFrameCount": 314,
  "livePlaybackEndFrame": 314,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-46-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 314
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
