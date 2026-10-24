import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P024_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN14.swf",
    "sha256": "9f6ef6b23238789d42978dcbb5a8307480288b0af02ce58653284b18b53170fc"
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

export const SHARED_ALG001_L11_P024_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p024",
  "title": "Absolute Value — unregistered ALG L11 glossary candidate",
  "sourceSwfSha256": "9f6ef6b23238789d42978dcbb5a8307480288b0af02ce58653284b18b53170fc",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p024/canvas-renderer.js",
  "assetSha256": "af31d18186f3f04295784ee9c9263c7700e2af355e5455e39983f02d91693aaf",
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
  "mainFrameDomain": "sprite-44",
  "mainFrameCount": 418,
  "livePlaybackEndFrame": 418,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-44-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 418
    }
  ],
  "sourceControlBehaviorLabel": "Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
