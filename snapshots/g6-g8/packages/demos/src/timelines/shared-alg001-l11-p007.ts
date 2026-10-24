import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P007_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/VB/L11VB04.swf",
    "sha256": "9880866bb3f5b6add5bdbe5ea7b8509a6ae01ee6ff573c3eff3b2211f5b814e5"
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

export const SHARED_ALG001_L11_P007_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p007",
  "title": "Absolute Value Review — unregistered ALG L11 glossary candidate",
  "sourceSwfSha256": "9880866bb3f5b6add5bdbe5ea7b8509a6ae01ee6ff573c3eff3b2211f5b814e5",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p007/canvas-renderer.js",
  "assetSha256": "76793e0ae2fad9df0d6faebcb375477dd078b439baa2c2ea49a9865b8ad4bb04",
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
  "mainFrameDomain": "sprite-51",
  "mainFrameCount": 507,
  "livePlaybackEndFrame": 507,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-51-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 507
    }
  ],
  "sourceControlBehaviorLabel": "Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
