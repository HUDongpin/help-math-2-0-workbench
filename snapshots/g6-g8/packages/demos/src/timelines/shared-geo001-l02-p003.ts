import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L02_P003_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L2/RW/L2RW04.swf",
    "sha256": "5bddaf217c180b700b70504a0542376a26fdf8786c80d90f2c7e0b949131a3f6"
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

export const SHARED_GEO001_L02_P003_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l02-p003",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "5bddaf217c180b700b70504a0542376a26fdf8786c80d90f2c7e0b949131a3f6",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l02-p003/canvas-renderer.js",
  "assetSha256": "0aa5ad9c3be675217f9eb2954ee86b7ac45a72cdf905eb7b3ee59730187899c8",
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
  "mainFrameDomain": "sprite-229",
  "mainFrameCount": 1130,
  "livePlaybackEndFrame": 1130,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-229-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1130
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
