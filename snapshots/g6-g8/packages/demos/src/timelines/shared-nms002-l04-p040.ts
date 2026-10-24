import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L04_P040_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L4/TS/L4TS06.swf",
    "sha256": "b1f0c00189c3bb98173a18cab984ddb718ec19d14aad4d2017d0a8c079271dac"
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

export const SHARED_NMS002_L04_P040_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l04-p040",
  "title": "4 Step Plan — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "b1f0c00189c3bb98173a18cab984ddb718ec19d14aad4d2017d0a8c079271dac",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l04-p040/canvas-renderer.js",
  "assetSha256": "695d3cc0b723025bb47e5967ce6097826121f1466c223db6044cb4f1ca005636",
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
