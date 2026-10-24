import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L01_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L1/RW/L1RW04.swf",
    "sha256": "3e0843273e2f5a44aec6746c9e7e38cdf42b5f8e847d008fa3ea575f4347ac48"
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

export const SHARED_GEO001_L01_P004_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l01-p004",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "3e0843273e2f5a44aec6746c9e7e38cdf42b5f8e847d008fa3ea575f4347ac48",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l01-p004/canvas-renderer.js",
  "assetSha256": "a7c9101c76f72ee942b981f70abfcbc244c79d273bfcebcea04cd23645c812e9",
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
  "mainFrameDomain": "sprite-225",
  "mainFrameCount": 1181,
  "livePlaybackEndFrame": 1181,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-225-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1181
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
