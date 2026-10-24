import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L01_P051_SOURCE = Object.freeze({
  "calibrationId": "g678-ts03-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L1/TS/L1TS03.swf",
    "sha256": "ed470785c467ff8c69d92d05751b89ca99f78d610b75f3cddd439bf882fd2db6"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts03-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts03-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_GEO001_L01_P051_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l01-p051",
  "title": "4 Step Plan — local-only TS03 Current-JS candidate",
  "sourceSwfSha256": "ed470785c467ff8c69d92d05751b89ca99f78d610b75f3cddd439bf882fd2db6",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l01-p051/canvas-renderer.js",
  "assetSha256": "6d1514215183e4874d24a7a1cc55cdcc09c428beb210f26d50cae7853077b9fa",
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
  "mainFrameCount": 223,
  "livePlaybackEndFrame": 223,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-25-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 223
    }
  ],
  "sourceControlBehaviorLabel": "TS03 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
