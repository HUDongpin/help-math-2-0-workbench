import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L09_P048_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L9/TS/L9TS06.swf",
    "sha256": "377dcff5b14720f4a0d5fd00e01b4c763d5b29e5c83e0fda8e2b2f3816518d6a"
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

export const SHARED_NMS002_L09_P048_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l09-p048",
  "title": "4 Step Plan — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "377dcff5b14720f4a0d5fd00e01b4c763d5b29e5c83e0fda8e2b2f3816518d6a",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l09-p048/canvas-renderer.js",
  "assetSha256": "85ab2207881dd7adc83528f22e710fb8649da14a762700192e2ba11f83b4ccd5",
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
