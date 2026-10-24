import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P017_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN07.swf",
    "sha256": "e4421160be7fb56287e4cfeed729e470d397105dbcf5d5471b55508fc22730b7"
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

export const SHARED_ALG001_L11_P017_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p017",
  "title": "Multiplying and Dividing with Positive Numbers — unregistered ALG L11 glossary candidate",
  "sourceSwfSha256": "e4421160be7fb56287e4cfeed729e470d397105dbcf5d5471b55508fc22730b7",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p017/canvas-renderer.js",
  "assetSha256": "8ace49bf5ff4290901eb2d9f65606bf00736a0286b07a8f7b2160014981a237c",
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
  "mainFrameDomain": "sprite-38",
  "mainFrameCount": 525,
  "livePlaybackEndFrame": 525,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-38-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 525
    }
  ],
  "sourceControlBehaviorLabel": "Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
