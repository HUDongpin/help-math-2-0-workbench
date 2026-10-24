import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L02_P020_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L2/VB/L2VB13.swf",
    "sha256": "c467be6d21b6aab1eb09523014bfc4aa67b4b8da7dd1a8ad44c33d82a8d7e8c9"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "linear-glossary-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-geo001-l02-p020/canvas-renderer.js",
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

export const SHARED_GEO001_L02_P020_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l02-p020",
  "title": "Other Polygons — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "c467be6d21b6aab1eb09523014bfc4aa67b4b8da7dd1a8ad44c33d82a8d7e8c9",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l02-p020/canvas-renderer.js",
  "assetSha256": "e73b8598a8b9f116840d18eb5728da6c2edd61f07c1c0867356b1feb6eb9f6e5",
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
  "mainFrameDomain": "sprite-22",
  "mainFrameCount": 443,
  "livePlaybackEndFrame": 443,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-22-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 443
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: glossary-host-bridge-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
