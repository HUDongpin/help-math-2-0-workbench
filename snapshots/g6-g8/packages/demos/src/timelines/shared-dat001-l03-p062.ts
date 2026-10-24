import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L03_P062_SOURCE = Object.freeze({
  "calibrationId": "g678-fq01-current-js-scaleout-43-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L3/FQ/L3FQ01.swf",
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

export const SHARED_DAT001_L03_P062_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l03-p062",
  "title": "Introduction — local-only FQ01 Current-JS candidate",
  "sourceSwfSha256": "60b4ec7345c9cd79093a4b671a185e35232e1bb3b5a5f5715c6e94bf345b9e14",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l03-p062/canvas-renderer.js",
  "assetSha256": "c03d385e578b7948418ef5716e1d75c75b80aa0bb2f1706bda881a2414b43eb0",
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
