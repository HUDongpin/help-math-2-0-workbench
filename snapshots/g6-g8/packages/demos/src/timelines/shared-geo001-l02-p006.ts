import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L02_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L2/RW/L2RW07.swf",
    "sha256": "3fe1ad9b48cdf15179e622eae2ca07c84db978260146a8fbfb81c1535a99c86a"
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

export const SHARED_GEO001_L02_P006_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l02-p006",
  "title": "Page 6 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "3fe1ad9b48cdf15179e622eae2ca07c84db978260146a8fbfb81c1535a99c86a",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l02-p006/canvas-renderer.js",
  "assetSha256": "7b9fc1e4e7b20dcfac34549059a9ca02b5875a58b446452e8c3cfbd62b9c720c",
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
  "mainFrameDomain": "sprite-130",
  "mainFrameCount": 364,
  "livePlaybackEndFrame": 364,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-130-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 364
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
