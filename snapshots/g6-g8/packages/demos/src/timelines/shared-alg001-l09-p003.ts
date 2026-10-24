import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P003_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-terminal-stop-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/RW/L9RW03.swf",
    "sha256": "7d084e3dae774bc83554423bd7c2dc938cef432e31cae626a1bc288a3854e5aa"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-terminal-stop-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-terminal-stop-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P003_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p003",
  "title": "Page 2 — local-only ALG L9 terminal-stop Current-JS candidate",
  "sourceSwfSha256": "7d084e3dae774bc83554423bd7c2dc938cef432e31cae626a1bc288a3854e5aa",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p003/canvas-renderer.js",
  "assetSha256": "330f43bb9cc10876e25f24d3d8011d2eac62ac13c58ba208df70ff9dc8eb8d85",
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
  "mainFrameDomain": "sprite-398",
  "mainFrameCount": 1053,
  "livePlaybackEndFrame": 1053,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-398-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1053
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-terminal-stop candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
