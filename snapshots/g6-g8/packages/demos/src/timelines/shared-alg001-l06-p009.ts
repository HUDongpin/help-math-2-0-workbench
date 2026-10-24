import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P009_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/RW/L6RW08.swf",
    "sha256": "e2dac19c356c2ae8497567b7c3610a22dbb7b29efe35b617e683a02c236c95d0"
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

export const SHARED_ALG001_L06_P009_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p009",
  "title": "Page 8 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "e2dac19c356c2ae8497567b7c3610a22dbb7b29efe35b617e683a02c236c95d0",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p009/canvas-renderer.js",
  "assetSha256": "f59be685af1cb8c7006d2718b9abc069c25ed008348ca04986daf218b31cd7d1",
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
  "mainFrameDomain": "sprite-382",
  "mainFrameCount": 1316,
  "livePlaybackEndFrame": 1316,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-382-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1316
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
