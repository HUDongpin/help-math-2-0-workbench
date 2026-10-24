import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L12_P034_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L12/TS/L12TS06.swf",
    "sha256": "fba05ed9e8aee0a3874a7323e43a491ece6a84ff7c6107393250d99c86e4f6cb"
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

export const SHARED_GEO001_L12_P034_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l12-p034",
  "title": "4 Step Plan — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "fba05ed9e8aee0a3874a7323e43a491ece6a84ff7c6107393250d99c86e4f6cb",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l12-p034/canvas-renderer.js",
  "assetSha256": "142c0dc14b0955c830704d3000109ed585a2a4b31aa93eb1f868a0b6d2532c43",
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
  "mainFrameDomain": "sprite-12",
  "mainFrameCount": 245,
  "livePlaybackEndFrame": 245,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-12-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 245
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
