import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P012_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-vb06-drag-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/VB/L9VB06.swf",
    "sha256": "a45c6ec1adf9d5341f65024188959fa7b7a99d7c9a189866b629c61df9c3f437"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-vb06-drag-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-vb06-drag-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P012_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p012",
  "title": "Proportional Relationship — local-only ALG L9 VB06 grouped-drag Current-JS candidate",
  "sourceSwfSha256": "a45c6ec1adf9d5341f65024188959fa7b7a99d7c9a189866b629c61df9c3f437",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p012/canvas-renderer.js",
  "assetSha256": "ad5a9dd70bde382fe85ed3fbb01f09f0d7972f82616580928244eb8de0d4cd42",
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
  "mainFrameDomain": "sprite-78",
  "mainFrameCount": 188,
  "livePlaybackEndFrame": 188,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-78-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 188
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 VB06 source-grouped-drag candidate awaiting browser product calibration; random feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
