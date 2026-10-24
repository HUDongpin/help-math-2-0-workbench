import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P013_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN03.swf",
    "sha256": "993e638328b1d5109b2d0855b03e32ab3ace81bbac28df80ce66daec9aaf0374"
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

export const SHARED_ALG001_L11_P013_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p013",
  "title": "Inequality Solutions — unregistered ALG L11 glossary candidate",
  "sourceSwfSha256": "993e638328b1d5109b2d0855b03e32ab3ace81bbac28df80ce66daec9aaf0374",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p013/canvas-renderer.js",
  "assetSha256": "6705295d1c5ec344697801140c0912c0e490b7ba5bab1b8285b66e2b662306d3",
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
  "mainFrameDomain": "sprite-19",
  "mainFrameCount": 205,
  "livePlaybackEndFrame": 205,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-19-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 205
    }
  ],
  "sourceControlBehaviorLabel": "Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
