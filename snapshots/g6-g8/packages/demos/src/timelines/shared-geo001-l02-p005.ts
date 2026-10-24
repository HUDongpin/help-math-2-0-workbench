import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L02_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L2/RW/L2RW06.swf",
    "sha256": "d15555c1d60b1c0e18e3df2c5bd392fa205a513f23e71a3c15b4b2da2db1fbfd"
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

export const SHARED_GEO001_L02_P005_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l02-p005",
  "title": "Page 5 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "d15555c1d60b1c0e18e3df2c5bd392fa205a513f23e71a3c15b4b2da2db1fbfd",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l02-p005/canvas-renderer.js",
  "assetSha256": "b4945cfb8b49f82e308fd6c26c7aca5fcce7db39bd214f532694a98d8b002007",
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
  "mainFrameDomain": "sprite-103",
  "mainFrameCount": 287,
  "livePlaybackEndFrame": 287,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-103-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 287
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
