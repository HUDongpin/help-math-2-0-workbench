import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P046_SOURCE = Object.freeze({
  "calibrationId": "g678-ts05-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/TS/L12TS05.swf",
    "sha256": "d2039fdca9a848c2940cad4ec98a85b58c7ce54bf62ee959aa19b3207760f5b7"
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

export const SHARED_ALG001_L12_P046_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p046",
  "title": "4 Step Plan — local-only TS05 Current-JS candidate",
  "sourceSwfSha256": "d2039fdca9a848c2940cad4ec98a85b58c7ce54bf62ee959aa19b3207760f5b7",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p046/canvas-renderer.js",
  "assetSha256": "f8f5e2e1c36ea85c9193e2791a5227d74bcef9eca64adc43e64c9743c8b1671c",
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
