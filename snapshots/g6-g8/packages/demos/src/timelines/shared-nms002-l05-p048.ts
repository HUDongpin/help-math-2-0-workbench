import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L05_P048_SOURCE = Object.freeze({
  "calibrationId": "g678-fq01-current-js-scaleout-43-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L5/FQ/L5FQ01.swf",
    "sha256": "8500ce042e34d8040d48ce3b8a6675efa39b98aa1f0daa67c358735575a1a6b1"
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

export const SHARED_NMS002_L05_P048_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l05-p048",
  "title": "Introduction — local-only FQ01 Current-JS candidate",
  "sourceSwfSha256": "8500ce042e34d8040d48ce3b8a6675efa39b98aa1f0daa67c358735575a1a6b1",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l05-p048/canvas-renderer.js",
  "assetSha256": "a6f6c89f53e3842ac1210149b7bc35bf179bd9cb6db3566df9aea6678de44123",
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
  "mainFrameCount": 52,
  "livePlaybackEndFrame": 52,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-51-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 52
    }
  ],
  "sourceControlBehaviorLabel": "FQ01 visual playback family calibrated; acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
