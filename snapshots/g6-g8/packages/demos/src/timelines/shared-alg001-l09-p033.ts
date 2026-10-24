import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P033_SOURCE = Object.freeze({
  "calibrationId": "g678-ts03-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS03.swf",
    "sha256": "03918d42ca1b5f4dc6555b09f6d5f5680ce078f8a81e310d50a82721ef1d03eb"
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

export const SHARED_ALG001_L09_P033_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p033",
  "title": "4 Step Plan — local-only TS03 Current-JS candidate",
  "sourceSwfSha256": "03918d42ca1b5f4dc6555b09f6d5f5680ce078f8a81e310d50a82721ef1d03eb",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p033/canvas-renderer.js",
  "assetSha256": "2a9ccd714ab53dd02ef98e766d1c538898327c69b3f1211c4cceb797888f33ba",
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
