import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L04_P020_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L4/IN/L4IN06.swf",
    "sha256": "81474ce5827136438d45a0ba5416ba41393f5051266c77b349a906126dec2971"
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

export const SHARED_ALG001_L04_P020_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l04-p020",
  "title": "Describing relations — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "81474ce5827136438d45a0ba5416ba41393f5051266c77b349a906126dec2971",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l04-p020/canvas-renderer.js",
  "assetSha256": "ddd0abb6813f1917c4374e802788051a644c26da2d43e71a99ad3c38c64755c0",
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
  "mainFrameDomain": "sprite-47",
  "mainFrameCount": 211,
  "livePlaybackEndFrame": 211,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-47-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 211
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
