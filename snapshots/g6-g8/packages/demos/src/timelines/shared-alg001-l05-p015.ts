import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L05_P015_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L5/VB/L5VB12.swf",
    "sha256": "b15501159b2a1a72da7a51346f4751c0121bb7734dcb2e9ddff9dc37d30d3b3e"
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

export const SHARED_ALG001_L05_P015_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l05-p015",
  "title": "Commutative Property and Associative Property Review — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "b15501159b2a1a72da7a51346f4751c0121bb7734dcb2e9ddff9dc37d30d3b3e",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l05-p015/canvas-renderer.js",
  "assetSha256": "c8b12ca9529581f9e59ba336e73db8ba3e7fc410eb3e3fa4f88d04f0927a2ecd",
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
  "mainFrameDomain": "sprite-81",
  "mainFrameCount": 644,
  "livePlaybackEndFrame": 644,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-81-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 644
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
