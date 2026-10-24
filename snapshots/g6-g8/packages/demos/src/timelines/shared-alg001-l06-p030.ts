import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P030_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/IN/L6IN02.swf",
    "sha256": "f4ddb001fbd9bcae61b7b5ca9c2c8f27177deb322466bd8136dcabae5d08c12f"
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

export const SHARED_ALG001_L06_P030_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p030",
  "title": "Evaluating Functions — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "f4ddb001fbd9bcae61b7b5ca9c2c8f27177deb322466bd8136dcabae5d08c12f",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p030/canvas-renderer.js",
  "assetSha256": "14540ee0580404b66f832500482a65eaeb1719b22b8e1eceff9aad0c2318829e",
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
  "mainFrameDomain": "sprite-108",
  "mainFrameCount": 1831,
  "livePlaybackEndFrame": 1831,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-108-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1831
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
