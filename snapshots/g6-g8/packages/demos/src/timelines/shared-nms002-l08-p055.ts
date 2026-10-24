import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L08_P055_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L8/TS/L8TS06.swf",
    "sha256": "c402d5cefb9cf23082aa0f620f1895bab5fcc92d98f0735e6f845074125e1bd1"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "pure-linear-source-static",
  "familyVisualPlaybackCalibrationPassed": true,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "embedded-audio-lifecycle-not-implemented"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_NMS002_L08_P055_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l08-p055",
  "title": "4 Step Plan — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "c402d5cefb9cf23082aa0f620f1895bab5fcc92d98f0735e6f845074125e1bd1",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l08-p055/canvas-renderer.js",
  "assetSha256": "24a8e4dd62c1dfec8639d278adb409e403ee0d9e619772a8814c5c5f54e9fe21",
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
  "mainFrameDomain": "sprite-12",
  "mainFrameCount": 245,
  "livePlaybackEndFrame": 245,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-12-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 245
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
