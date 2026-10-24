import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L02_P052_SOURCE = Object.freeze({
  "calibrationId": "g678-fq01-current-js-scaleout-43-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L2/FQ/L2FQ01.swf",
    "sha256": "60b4ec7345c9cd79093a4b671a185e35232e1bb3b5a5f5715c6e94bf345b9e14"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "final-quiz-intro-source-static",
  "familyVisualPlaybackCalibrationPassed": true,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_DAT001_L02_P052_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l02-p052",
  "title": "Introduction — local-only FQ01 Current-JS candidate",
  "sourceSwfSha256": "60b4ec7345c9cd79093a4b671a185e35232e1bb3b5a5f5715c6e94bf345b9e14",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l02-p052/canvas-renderer.js",
  "assetSha256": "0dcd87b7b84d064718ca1f37fe907702d7fd942e06b142284a6e4ca53de3dbce",
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
  "mainFrameDomain": "sprite-75",
  "mainFrameCount": 52,
  "livePlaybackEndFrame": 52,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-75-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 52
    }
  ],
  "sourceControlBehaviorLabel": "FQ01 visual playback family calibrated; acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
