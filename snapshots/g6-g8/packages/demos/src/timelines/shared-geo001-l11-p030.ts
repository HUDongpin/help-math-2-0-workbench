import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L11_P030_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L11/IN/L11IN17.swf",
    "sha256": "5b72509365917d1bb3e1312bd2d15da596cb582607f3aa4a1b1758dd24fed2dd"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "linear-glossary-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-geo001-l11-p030/canvas-renderer.js",
  "productBlockers": [
    "glossary-host-bridge-not-reconstructed",
    "embedded-audio-lifecycle-not-implemented"
  ],
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "actionScriptExecuted": false,
  "nestedAudioPlaybackCompiled": false,
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_GEO001_L11_P030_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l11-p030",
  "title": "Reflections in the x-axis on the Coordinate Plane — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "5b72509365917d1bb3e1312bd2d15da596cb582607f3aa4a1b1758dd24fed2dd",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l11-p030/canvas-renderer.js",
  "assetSha256": "c9cf7df23122b38395bd640876863befd34189835924f77ccd6692a642cef8aa",
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
  "mainFrameDomain": "sprite-134",
  "mainFrameCount": 1405,
  "livePlaybackEndFrame": 1405,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-134-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1405
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: glossary-host-bridge-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
