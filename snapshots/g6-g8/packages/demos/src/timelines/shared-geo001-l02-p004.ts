import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L02_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L2/RW/L2RW05.swf",
    "sha256": "abc9e6070e5bd604c1eb55e4a8762455d2e75381f1a884b63e89cf5cb9bde437"
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

export const SHARED_GEO001_L02_P004_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l02-p004",
  "title": "Page 4 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "abc9e6070e5bd604c1eb55e4a8762455d2e75381f1a884b63e89cf5cb9bde437",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l02-p004/canvas-renderer.js",
  "assetSha256": "3169c8bdb2be042d6dc28819f449d69431ad010ba86e3d2ef4bf3352a59bf367",
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
  "mainFrameDomain": "sprite-127",
  "mainFrameCount": 230,
  "livePlaybackEndFrame": 230,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-127-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 230
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
