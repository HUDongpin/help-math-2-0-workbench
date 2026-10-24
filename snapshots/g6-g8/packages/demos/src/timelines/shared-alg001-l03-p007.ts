import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P007_SOURCE = Object.freeze({
  "calibrationId": "g678-vb03-l1-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/VB/L3VB03.swf",
    "sha256": "e2907984f1ebb6e40aa90239e8fb4cff39b2dd9a0ef502e9b10c5953b236d8e8"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "vb03-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "vb03-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L03_P007_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p007",
  "title": "Mathematical Expression, Variable — local-only VB-3 Current-JS candidate",
  "sourceSwfSha256": "e2907984f1ebb6e40aa90239e8fb4cff39b2dd9a0ef502e9b10c5953b236d8e8",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p007/canvas-renderer.js",
  "assetSha256": "2f67225f9e8a5b151c9da0e12e58fb376148f9c371585be431aabb7338f60f74",
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
  "mainFrameDomain": "sprite-36",
  "mainFrameCount": 392,
  "livePlaybackEndFrame": 392,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-36-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 392
    }
  ],
  "sourceControlBehaviorLabel": "VB-3 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
