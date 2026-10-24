import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P016_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN06.swf",
    "sha256": "786e847b6ee75ab8e21852213250080fe41bb1a7c33d8da3cd9177fb9e9c882c"
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

export const SHARED_ALG001_L11_P016_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p016",
  "title": "Solving Inequalities: Adding — unregistered ALG L11 glossary candidate",
  "sourceSwfSha256": "786e847b6ee75ab8e21852213250080fe41bb1a7c33d8da3cd9177fb9e9c882c",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p016/canvas-renderer.js",
  "assetSha256": "5c3eea9393427a2d220df791ddfe9658b14381453fc66fc48539edcdd1a83c7c",
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
  "mainFrameDomain": "sprite-27",
  "mainFrameCount": 626,
  "livePlaybackEndFrame": 626,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-27-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 626
    }
  ],
  "sourceControlBehaviorLabel": "Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
