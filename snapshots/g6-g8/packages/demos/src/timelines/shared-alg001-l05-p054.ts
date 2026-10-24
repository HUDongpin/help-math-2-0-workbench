import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L05_P054_SOURCE = Object.freeze({
  "calibrationId": "g678-ts02-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L5/TS/L5TS02.swf",
    "sha256": "dbe218782b6578e0d7b68d425d5316e541a2c414232d63c7cd186a9e03312064"
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

export const SHARED_ALG001_L05_P054_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l05-p054",
  "title": "4 Step Plan — local-only TS02 Current-JS candidate",
  "sourceSwfSha256": "dbe218782b6578e0d7b68d425d5316e541a2c414232d63c7cd186a9e03312064",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l05-p054/canvas-renderer.js",
  "assetSha256": "6191dd0df75f784f2d250a0008f62acb905c16f49a93f315d69f6a7a24921be1",
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
  "mainFrameCount": 337,
  "livePlaybackEndFrame": 337,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-26-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 337
    }
  ],
  "sourceControlBehaviorLabel": "TS02 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
