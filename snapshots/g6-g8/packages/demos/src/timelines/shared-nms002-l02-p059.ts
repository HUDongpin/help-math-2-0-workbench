import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L02_P059_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L2/TS/L2TS06.swf",
    "sha256": "f11c7b39650aec42e988942b54a0d7d4f4a55a9b66b9b564986c44f6e5996331"
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

export const SHARED_NMS002_L02_P059_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l02-p059",
  "title": "4 Step Plan — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "f11c7b39650aec42e988942b54a0d7d4f4a55a9b66b9b564986c44f6e5996331",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l02-p059/canvas-renderer.js",
  "assetSha256": "96a4a7fb8afdca413f31eb562255171c0c0b090cefbf010dbf84beceb602b000",
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
  "mainFrameDomain": "sprite-21",
  "mainFrameCount": 124,
  "livePlaybackEndFrame": 124,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-21-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 124
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
