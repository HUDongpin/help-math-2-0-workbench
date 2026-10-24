import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L01_P021_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L1/IN/L1IN02.swf",
    "sha256": "c46ea7f2769c11713b5202fc5ee8b4239228e4c471048646e9155a42b9f51d3d"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "in02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "in02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L01_P021_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l01-p021",
  "title": "Number Line — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "c46ea7f2769c11713b5202fc5ee8b4239228e4c471048646e9155a42b9f51d3d",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l01-p021/canvas-renderer.js",
  "assetSha256": "cb7fb7184a3fa43ab6fc57754a65fb6bdb81194d9d173504bfc1c507bbe08253",
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
  "mainFrameDomain": "sprite-72",
  "mainFrameCount": 520,
  "livePlaybackEndFrame": 520,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-72-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 520
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
