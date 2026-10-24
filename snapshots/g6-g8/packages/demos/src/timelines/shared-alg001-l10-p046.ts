import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L10_P046_SOURCE = Object.freeze({
  "calibrationId": "g678-ts05-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L10/TS/L10TS05.swf",
    "sha256": "f61c4be52569ab61ab8b7764f0b9ca1e44067e3a39840023a8f44abb97e9c841"
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

export const SHARED_ALG001_L10_P046_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l10-p046",
  "title": "4 Step Plan — local-only TS05 Current-JS candidate",
  "sourceSwfSha256": "f61c4be52569ab61ab8b7764f0b9ca1e44067e3a39840023a8f44abb97e9c841",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l10-p046/canvas-renderer.js",
  "assetSha256": "a9ee041837a1fc7ec5250851883a6c85250794deceb0da7077e0cf19c65950ff",
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
  "mainFrameCount": 263,
  "livePlaybackEndFrame": 263,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-30-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 263
    }
  ],
  "sourceControlBehaviorLabel": "TS05 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
