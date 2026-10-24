import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P016_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/IN/L3IN02.swf",
    "sha256": "03fd262ebf7588cfd9e4b07d848a31456d67b49bc67c1c5911b88b56e6a54ca5"
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

export const SHARED_ALG001_L03_P016_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p016",
  "title": "Identifying patterns in a sequence — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "03fd262ebf7588cfd9e4b07d848a31456d67b49bc67c1c5911b88b56e6a54ca5",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p016/canvas-renderer.js",
  "assetSha256": "0f41d44815a830a86ca975d6160ad6050483d0deb84629ad9e08b0ab493e87ef",
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
  "mainFrameDomain": "sprite-60",
  "mainFrameCount": 565,
  "livePlaybackEndFrame": 565,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-60-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 565
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
