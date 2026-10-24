import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P031_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/IN/L12IN17.swf",
    "sha256": "2b098b473babebfc5dc0f9e6bd0402aefff9a798e9883e18c99aa3685b168f0a"
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

export const SHARED_ALG001_L12_P031_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p031",
  "title": "Graphing Inequalities — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "2b098b473babebfc5dc0f9e6bd0402aefff9a798e9883e18c99aa3685b168f0a",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p031/canvas-renderer.js",
  "assetSha256": "d5fdccf6ca1e845026ac40a2af29739495e3779d94966ae527f6779ab082deb4",
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
  "mainFrameDomain": "sprite-58",
  "mainFrameCount": 229,
  "livePlaybackEndFrame": 229,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-58-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 229
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
