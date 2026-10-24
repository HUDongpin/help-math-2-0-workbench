import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L12_P003_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L12/RW/L12RW03.swf",
    "sha256": "eb5110276d48fdad12ea9ba5163a2b34a79a6ab032987b26a3f3f18bf2340153"
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

export const SHARED_GEO001_L12_P003_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l12-p003",
  "title": "Page 2 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "eb5110276d48fdad12ea9ba5163a2b34a79a6ab032987b26a3f3f18bf2340153",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l12-p003/canvas-renderer.js",
  "assetSha256": "f7f852894c58a37d5db01eeacb2641603a739e184bd95413d09f96614f04e17e",
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
  "mainFrameDomain": "sprite-488",
  "mainFrameCount": 400,
  "livePlaybackEndFrame": 400,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-488-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 400
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
