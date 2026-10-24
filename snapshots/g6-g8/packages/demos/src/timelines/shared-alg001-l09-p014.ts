import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P014_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN02.swf",
    "sha256": "5e1fadcece8f37ef5107437e886464a776c509b8db8138a7a3ee128338e9f8f8"
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

export const SHARED_ALG001_L09_P014_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p014",
  "title": "Making Ratios — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "5e1fadcece8f37ef5107437e886464a776c509b8db8138a7a3ee128338e9f8f8",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p014/canvas-renderer.js",
  "assetSha256": "965ee3dba0bb3b580dd80741bbf6ce5e16bb6c9e93c418a200da2d667960c5b0",
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
  "mainFrameDomain": "sprite-28",
  "mainFrameCount": 691,
  "livePlaybackEndFrame": 691,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-28-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 691
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
