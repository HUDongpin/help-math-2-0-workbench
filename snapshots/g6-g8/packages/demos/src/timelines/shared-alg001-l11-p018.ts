import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P018_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN08.swf",
    "sha256": "b6f1870dba3b6846556433525e775e6f5b1e61889db5e2a535392198c60ced62"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l11-simple-glossary-tranche1-source-static",
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "registration-and-modern-my-lesson-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L11_P018_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p018",
  "title": "Multiplying and Dividing with Negative Numbers — unregistered ALG L11 glossary candidate",
  "sourceSwfSha256": "b6f1870dba3b6846556433525e775e6f5b1e61889db5e2a535392198c60ced62",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p018/canvas-renderer.js",
  "assetSha256": "1eae7209d2c3900ff94e917e3d265196c8307341478b2c2a0418895b72129932",
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
  "mainFrameDomain": "sprite-39",
  "mainFrameCount": 569,
  "livePlaybackEndFrame": 569,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-39-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 569
    }
  ],
  "sourceControlBehaviorLabel": "Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
