import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L01_P050_SOURCE = Object.freeze({
  "calibrationId": "g678-ts05-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L1/TS/L1TS05.swf",
    "sha256": "49153940691c626f698ad301ed0b5b7a0e253fcb754788557475b0b4bd0c2190"
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

export const SHARED_ALG001_L01_P050_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l01-p050",
  "title": "4 Step Plan — local-only TS05 Current-JS candidate",
  "sourceSwfSha256": "49153940691c626f698ad301ed0b5b7a0e253fcb754788557475b0b4bd0c2190",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l01-p050/canvas-renderer.js",
  "assetSha256": "a2349866badb84b48c2eb51214a25e846098f69a6181aa0bb827f39e5fbb06c8",
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
  "mainFrameDomain": "sprite-40",
  "mainFrameCount": 274,
  "livePlaybackEndFrame": 274,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-40-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 274
    }
  ],
  "sourceControlBehaviorLabel": "TS05 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
