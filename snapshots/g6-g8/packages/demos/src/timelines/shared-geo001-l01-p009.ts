import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L01_P009_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L1/RW/L1RW09.swf",
    "sha256": "864a2d07d7ef1f34348754a49c03e91bc0e0b46d0249403f0ac66a70435c068c"
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

export const SHARED_GEO001_L01_P009_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l01-p009",
  "title": "Page 8 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "864a2d07d7ef1f34348754a49c03e91bc0e0b46d0249403f0ac66a70435c068c",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l01-p009/canvas-renderer.js",
  "assetSha256": "562e131c1a2761fa8c73a3f6498fb33acb7b6e2eeebd465407bce3a45de2355c",
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
  "mainFrameCount": 268,
  "livePlaybackEndFrame": 268,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-21-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 268
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
