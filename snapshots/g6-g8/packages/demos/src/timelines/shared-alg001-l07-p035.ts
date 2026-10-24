import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L07_P035_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L7/IN/L7IN16.swf",
    "sha256": "cac6b70e20f3871a03d2487ac8ea01798f51b0e0f4ead7467d8739968fb2c627"
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

export const SHARED_ALG001_L07_P035_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l07-p035",
  "title": "Graphing y = x² from Table of Function Values — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "cac6b70e20f3871a03d2487ac8ea01798f51b0e0f4ead7467d8739968fb2c627",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l07-p035/canvas-renderer.js",
  "assetSha256": "7234e0730d65f642ab36c7fa059cee6d6b09df9e06e4d9547caf376a04062c68",
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
  "mainFrameDomain": "sprite-67",
  "mainFrameCount": 547,
  "livePlaybackEndFrame": 547,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-67-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 547
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
