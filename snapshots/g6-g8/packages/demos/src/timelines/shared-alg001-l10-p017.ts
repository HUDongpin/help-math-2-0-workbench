import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L10_P017_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L10/IN/L10IN02.swf",
    "sha256": "b816f92923f63c918c15e4d42a21c09349cd0e16487a6656b308106fac32cb04"
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

export const SHARED_ALG001_L10_P017_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l10-p017",
  "title": "Powers and Exponents — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "b816f92923f63c918c15e4d42a21c09349cd0e16487a6656b308106fac32cb04",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l10-p017/canvas-renderer.js",
  "assetSha256": "51ed87ad3a02f2df7923f07fc9064973ff0d8e7ae1ea47221e7b55c88f45979c",
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
  "mainFrameDomain": "sprite-23",
  "mainFrameCount": 338,
  "livePlaybackEndFrame": 338,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-23-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 338
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
