import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P016_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-in04-numeric-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN04.swf",
    "sha256": "ced5bd922a1f475c2296b77a547e4db3ef015704c98dbcf5ee10feda4a34dc66"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-in04-numeric-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-in04-numeric-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P016_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p016",
  "title": "Making Ratios — local-only ALG L9 IN04 numeric-response Current-JS candidate",
  "sourceSwfSha256": "ced5bd922a1f475c2296b77a547e4db3ef015704c98dbcf5ee10feda4a34dc66",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p016/canvas-renderer.js",
  "assetSha256": "0aec59da91603f1be853e37fc1cbe9cda758ec5bd93222e7296ee705c8b8f71d",
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
  "mainFrameDomain": "sprite-81",
  "mainFrameCount": 420,
  "livePlaybackEndFrame": 420,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-81-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 420
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 IN04 source-numeric-response candidate awaiting browser product calibration; right-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
