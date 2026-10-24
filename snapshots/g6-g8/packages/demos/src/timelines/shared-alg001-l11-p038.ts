import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P038_SOURCE = Object.freeze({
  "calibrationId": "g678-ts05-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/TS/L11TS05.swf",
    "sha256": "b68cdba0aba31c5550d5486386f1327de9fb570c8b1652d1d5e086903892b5bb"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts05-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts05-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L11_P038_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p038",
  "title": "4 Step Plan — local-only TS05 Current-JS candidate",
  "sourceSwfSha256": "b68cdba0aba31c5550d5486386f1327de9fb570c8b1652d1d5e086903892b5bb",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p038/canvas-renderer.js",
  "assetSha256": "027ff7a3b91ada27e902430a1baf98e37dbcc1853b82b6f3d13c7f2b25822a9b",
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
  "mainFrameDomain": "sprite-30",
  "mainFrameCount": 234,
  "livePlaybackEndFrame": 234,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-30-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 234
    }
  ],
  "sourceControlBehaviorLabel": "TS05 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
