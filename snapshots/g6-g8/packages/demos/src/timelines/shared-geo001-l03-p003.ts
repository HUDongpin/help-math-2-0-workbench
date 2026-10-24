import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L03_P003_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L3/RW/L3RW03.swf",
    "sha256": "605321dc30bc7767f8d0ca224cc23bde1b2a2bdf395d3b8ef4c902e724bccd6d"
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

export const SHARED_GEO001_L03_P003_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l03-p003",
  "title": "Page 2 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "605321dc30bc7767f8d0ca224cc23bde1b2a2bdf395d3b8ef4c902e724bccd6d",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l03-p003/canvas-renderer.js",
  "assetSha256": "b34ddcf277186037915fe3d34d7df4245fb480413422ac9005cfde934afb66e4",
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
  "mainFrameDomain": "sprite-121",
  "mainFrameCount": 363,
  "livePlaybackEndFrame": 363,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-121-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 363
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
