import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P033_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/IN/L3IN19.swf",
    "sha256": "8e0ccdbbd4d44c2018f833491e60853b9313c7862d8699c133685b0e10671c7d"
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

export const SHARED_ALG001_L03_P033_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p033",
  "title": "Making a table of values from an equation — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "8e0ccdbbd4d44c2018f833491e60853b9313c7862d8699c133685b0e10671c7d",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p033/canvas-renderer.js",
  "assetSha256": "8d475f75d86743769cbe9990f16b73f543d1e2e4ba7d636614153fc5a14f6897",
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
  "mainFrameDomain": "sprite-291",
  "mainFrameCount": 1136,
  "livePlaybackEndFrame": 1136,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-291-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1136
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
