import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P023_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN13.swf",
    "sha256": "aa54994646e02d3e80fd650f5e9e71cde61b48e9f3981d71c72069f72b43f19b"
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

export const SHARED_ALG001_L11_P023_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p023",
  "title": "Absolute Value — unregistered ALG L11 glossary candidate",
  "sourceSwfSha256": "aa54994646e02d3e80fd650f5e9e71cde61b48e9f3981d71c72069f72b43f19b",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p023/canvas-renderer.js",
  "assetSha256": "7792abfe77e3e97dae244780d7c26b208035d37dab6b1191f13aa616fce1ea0f",
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
  "mainFrameDomain": "sprite-59",
  "mainFrameCount": 579,
  "livePlaybackEndFrame": 579,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-59-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 579
    }
  ],
  "sourceControlBehaviorLabel": "Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
