import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P038_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-guided-tutorial-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS08.swf",
    "sha256": "453e9b535c6b349e8ed94598e8db555339d67dc15ac4b89042a117379761112a"
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

export const SHARED_ALG001_L09_P038_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p038",
  "title": "Question 2 — local-only ALG L9 guided tutorial Current-JS candidate",
  "sourceSwfSha256": "453e9b535c6b349e8ed94598e8db555339d67dc15ac4b89042a117379761112a",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p038/canvas-renderer.js",
  "assetSha256": "883c40b7c74db8f433e7184b03c2c69bd6e3a18b21ec6eeb260312cc6a6e63ab",
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
  "mainFrameDomain": "sprite-329",
  "mainFrameCount": 934,
  "livePlaybackEndFrame": 934,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-329-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 934
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-guided tutorial candidate awaiting browser product calibration; narration/feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
