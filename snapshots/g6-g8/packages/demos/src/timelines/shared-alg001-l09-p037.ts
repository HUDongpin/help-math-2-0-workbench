import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P037_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-guided-tutorial-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS07.swf",
    "sha256": "29bfe39a4c2ffd7b163b5c03925efad55ae86b4533a19c278e1abf8dbb91cd35"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "advanced-manual-alg-l09-guided-tutorial-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-guided-tutorial-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P037_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p037",
  "title": "Question 1 — local-only ALG L9 guided tutorial Current-JS candidate",
  "sourceSwfSha256": "29bfe39a4c2ffd7b163b5c03925efad55ae86b4533a19c278e1abf8dbb91cd35",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p037/canvas-renderer.js",
  "assetSha256": "8c6c9fdf53b7fbc17bc5a28ce5873c943cabe1defdec4a0c88a2357698db6ffc",
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
  "mainFrameDomain": "sprite-307",
  "mainFrameCount": 942,
  "livePlaybackEndFrame": 942,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-307-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 942
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-guided tutorial candidate awaiting browser product calibration; narration/feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
