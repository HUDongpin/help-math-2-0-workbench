import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P039_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-guided-tutorial-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS09.swf",
    "sha256": "7d972629424cab7fe6aafdb21d56f7049dc8dd906069d44006361036aac178ca"
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

export const SHARED_ALG001_L09_P039_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p039",
  "title": "Question 3 — local-only ALG L9 guided tutorial Current-JS candidate",
  "sourceSwfSha256": "7d972629424cab7fe6aafdb21d56f7049dc8dd906069d44006361036aac178ca",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p039/canvas-renderer.js",
  "assetSha256": "db8922721b43bcdaf0a50c2b3ed5d1ff9a58929f38c1dd17baab2151f1c9bbf2",
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
  "mainFrameDomain": "sprite-342",
  "mainFrameCount": 1111,
  "livePlaybackEndFrame": 1111,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-342-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1111
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-guided tutorial candidate awaiting browser product calibration; narration/feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
