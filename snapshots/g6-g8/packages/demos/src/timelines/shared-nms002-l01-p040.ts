import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L01_P040_SOURCE = Object.freeze({
  "calibrationId": "g678-ts04-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L1/TS/L1TS04.swf",
    "sha256": "5aab5af3e867255098af58652ca8a3fc752eaaab78794ad2198baf735ea7c018"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts04-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts04-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_NMS002_L01_P040_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l01-p040",
  "title": "4 Step Plan — local-only TS04 Current-JS candidate",
  "sourceSwfSha256": "5aab5af3e867255098af58652ca8a3fc752eaaab78794ad2198baf735ea7c018",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l01-p040/canvas-renderer.js",
  "assetSha256": "bd258968b9bd7aa3329a4d905d62ce282bfeb8f5eb4bac499161c45c0e5528ce",
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
  "mainFrameDomain": "sprite-67",
  "mainFrameCount": 328,
  "livePlaybackEndFrame": 328,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-67-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 328
    }
  ],
  "sourceControlBehaviorLabel": "TS04 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
