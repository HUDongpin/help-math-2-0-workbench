import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L04_P047_SOURCE = Object.freeze({
  "calibrationId": "g678-ts05-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L4/TS/L4TS05.swf",
    "sha256": "51f43be1dba3fe0939efdefd92d680c243be5b389613b3cb03b4820a532ccd23"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts05-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts05-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L04_P047_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l04-p047",
  "title": "4 Step Plan — local-only TS05 Current-JS candidate",
  "sourceSwfSha256": "51f43be1dba3fe0939efdefd92d680c243be5b389613b3cb03b4820a532ccd23",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l04-p047/canvas-renderer.js",
  "assetSha256": "7ad62e510e015e49556b7c0f640910e6b20ede50cf2bb7948b1ccfe1ace5da48",
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
  "mainFrameCount": 234,
  "livePlaybackEndFrame": 234,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-30-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 234
    }
  ],
  "sourceControlBehaviorLabel": "TS05 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
