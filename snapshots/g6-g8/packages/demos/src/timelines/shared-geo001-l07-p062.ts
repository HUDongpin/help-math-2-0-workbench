import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L07_P062_SOURCE = Object.freeze({
  "calibrationId": "g678-fq01-current-js-scaleout-43-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L7/FQ/L7FQ01.swf",
    "sha256": "14f1f2d4f0d9f4ca454c36263320dd047bc0a095dfddcc95d9613b4a75cdefe1"
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

export const SHARED_GEO001_L07_P062_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l07-p062",
  "title": "Introduction — local-only FQ01 Current-JS candidate",
  "sourceSwfSha256": "14f1f2d4f0d9f4ca454c36263320dd047bc0a095dfddcc95d9613b4a75cdefe1",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l07-p062/canvas-renderer.js",
  "assetSha256": "7189b405497b852fd32da259f86f3e9410d8eb1f3bcb9b1f53966f46ff23e0ab",
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
  "mainFrameDomain": "sprite-26",
  "mainFrameCount": 52,
  "livePlaybackEndFrame": 52,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-26-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 52
    }
  ],
  "sourceControlBehaviorLabel": "FQ01 visual playback family calibrated; acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
