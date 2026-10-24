import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L03_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L3/RW/L3RW05.swf",
    "sha256": "fc14af9ed58089eedafca2d826a50c30009db7a9a0201ef0e6b29f8b53f590cf"
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

export const SHARED_GEO001_L03_P005_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l03-p005",
  "title": "Page 4 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "fc14af9ed58089eedafca2d826a50c30009db7a9a0201ef0e6b29f8b53f590cf",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l03-p005/canvas-renderer.js",
  "assetSha256": "1f8c76178cd47852c5527c500d985138c0db443d214c323c9091fd12e811893b",
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
  "mainFrameDomain": "sprite-100",
  "mainFrameCount": 620,
  "livePlaybackEndFrame": 620,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-100-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 620
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
