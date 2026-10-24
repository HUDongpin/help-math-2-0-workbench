import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L02_P050_SOURCE = Object.freeze({
  "calibrationId": "g678-ts03-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L2/TS/L2TS03.swf",
    "sha256": "ab20be82f6b0207f58d4b79b8bb180a9a5c4dbb3376c25b581b4e0ea3d48db7b"
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

export const SHARED_ALG001_L02_P050_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l02-p050",
  "title": "4 Step Plan — local-only TS03 Current-JS candidate",
  "sourceSwfSha256": "ab20be82f6b0207f58d4b79b8bb180a9a5c4dbb3376c25b581b4e0ea3d48db7b",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l02-p050/canvas-renderer.js",
  "assetSha256": "3315ecf2e7da0733d50068470ca3f5a663e74acfc375693f31e6a5316a2a0b55",
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
