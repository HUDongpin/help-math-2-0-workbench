import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L01_P047_SOURCE = Object.freeze({
  "calibrationId": "g678-ts02-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L1/TS/L1TS02.swf",
    "sha256": "a9782ef914fe3faf489a0ebae7f79b9949f6c9025697b81e6623fdce4ba669a1"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L01_P047_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l01-p047",
  "title": "4 Step Plan — local-only TS02 Current-JS candidate",
  "sourceSwfSha256": "a9782ef914fe3faf489a0ebae7f79b9949f6c9025697b81e6623fdce4ba669a1",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l01-p047/canvas-renderer.js",
  "assetSha256": "f65b8e3892329289ba28a0ea2e1291951791ccb4900accbd8f2e31edfec37779",
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
  "mainFrameDomain": "sprite-26",
  "mainFrameCount": 351,
  "livePlaybackEndFrame": 351,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-26-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 351
    }
  ],
  "sourceControlBehaviorLabel": "TS02 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
