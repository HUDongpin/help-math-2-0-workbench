import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L12_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L12/RW/L12RW02.swf",
    "sha256": "0c96c83b654239c23a1751c7e1980023f10f619833e428ab053cfedde9de32ce"
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

export const SHARED_GEO001_L12_P002_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l12-p002",
  "title": "Page 1 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "0c96c83b654239c23a1751c7e1980023f10f619833e428ab053cfedde9de32ce",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l12-p002/canvas-renderer.js",
  "assetSha256": "61ead4782c0881126df1442412199b1123ef01a1fd3de7497b325a0db191cc7e",
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
  "mainFrameDomain": "sprite-80",
  "mainFrameCount": 351,
  "livePlaybackEndFrame": 351,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-80-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 351
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
