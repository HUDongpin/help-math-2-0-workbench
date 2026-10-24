import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L02_P023_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L2/IN/L2IN02.swf",
    "sha256": "1d99e0a3ec4499b8bb23783d5e0ea122f1d932ff0fa88d144103da2a3b8ae910"
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

export const SHARED_ALG001_L02_P023_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l02-p023",
  "title": "The difference between a constant and a variable — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "1d99e0a3ec4499b8bb23783d5e0ea122f1d932ff0fa88d144103da2a3b8ae910",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l02-p023/canvas-renderer.js",
  "assetSha256": "709d5587ad85c638ea010dd49446c409d775dd4b76cde0544ef80ce5aad0be36",
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
  "mainFrameDomain": "sprite-25",
  "mainFrameCount": 502,
  "livePlaybackEndFrame": 502,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-25-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 502
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
