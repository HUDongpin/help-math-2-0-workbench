import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L02_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L2/RW/L2RW03.swf",
    "sha256": "0bbd6db5c012d053ed7310366917b4c5c75cc8eb5e862177cb6125696a7e423b"
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

export const SHARED_GEO001_L02_P002_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l02-p002",
  "title": "Page 2 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "0bbd6db5c012d053ed7310366917b4c5c75cc8eb5e862177cb6125696a7e423b",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l02-p002/canvas-renderer.js",
  "assetSha256": "14b3cbaa237bec68f88b488bb501131bf32a94cfa2b2d418ff7b2e1fb324e284",
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
  "mainFrameDomain": "sprite-94",
  "mainFrameCount": 698,
  "livePlaybackEndFrame": 698,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-94-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 698
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
