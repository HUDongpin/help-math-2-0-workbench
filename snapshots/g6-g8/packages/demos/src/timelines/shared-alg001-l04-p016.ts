import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L04_P016_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L4/IN/L4IN02.swf",
    "sha256": "be8e37d5befff675bc1f91c4c2d46f1e3685646092caca4c3eb7543ca416d51e"
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

export const SHARED_ALG001_L04_P016_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l04-p016",
  "title": "Describing relations — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "be8e37d5befff675bc1f91c4c2d46f1e3685646092caca4c3eb7543ca416d51e",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l04-p016/canvas-renderer.js",
  "assetSha256": "f72bf6bbc2814d2c7983bc90a3244498894b9c15c3d256f35b76282e583e6cc8",
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
  "mainFrameDomain": "sprite-32",
  "mainFrameCount": 472,
  "livePlaybackEndFrame": 472,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-32-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 472
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
