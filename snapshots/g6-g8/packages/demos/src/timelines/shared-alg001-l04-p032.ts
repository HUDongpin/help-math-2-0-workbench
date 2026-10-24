import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L04_P032_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L4/IN/L4IN18.swf",
    "sha256": "a58c637bf77aad8101cbb636d80d3e71de3d490265c7cbe49b5e6abebf8d36cc"
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

export const SHARED_ALG001_L04_P032_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l04-p032",
  "title": "Using ratios to make predictions in proportional situations — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "a58c637bf77aad8101cbb636d80d3e71de3d490265c7cbe49b5e6abebf8d36cc",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l04-p032/canvas-renderer.js",
  "assetSha256": "b317420eaf68e4b75f0fa7878790d997e22c4605fe15533e675b7adaf1f4b020",
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
  "mainFrameDomain": "sprite-86",
  "mainFrameCount": 941,
  "livePlaybackEndFrame": 941,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-86-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 941
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
