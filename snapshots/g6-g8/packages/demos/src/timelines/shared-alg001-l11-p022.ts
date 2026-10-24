import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P022_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN12.swf",
    "sha256": "5e2b65a3658e07d358e8838b5d50296e300c1ae8c2e84b3f9596e1ce670a1a14"
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

export const SHARED_ALG001_L11_P022_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p022",
  "title": "2-Step Inequalities — unregistered ALG L11 glossary candidate",
  "sourceSwfSha256": "5e2b65a3658e07d358e8838b5d50296e300c1ae8c2e84b3f9596e1ce670a1a14",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p022/canvas-renderer.js",
  "assetSha256": "5d440ba857179aa6f04e962dc5ea7eb5f6bc9491d792d48403db6ea9c91758f8",
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
  "mainFrameDomain": "sprite-50",
  "mainFrameCount": 841,
  "livePlaybackEndFrame": 841,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-50-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 841
    }
  ],
  "sourceControlBehaviorLabel": "Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
