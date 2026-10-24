import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L07_P040_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L7/IN/L7IN23.swf",
    "sha256": "9fe3b0672c1be385e62f70cb097b69db232960b3e482f8e526f01496a11b18a7"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "linear-glossary-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-geo001-l07-p040/canvas-renderer.js",
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

export const SHARED_GEO001_L07_P040_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l07-p040",
  "title": "Surface Area of Cylinders — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "9fe3b0672c1be385e62f70cb097b69db232960b3e482f8e526f01496a11b18a7",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l07-p040/canvas-renderer.js",
  "assetSha256": "874b45e935e316ebde0bfb8ba2f17c35196c775b9d650a69770eb8751d88e2e6",
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
  "mainFrameDomain": "sprite-140",
  "mainFrameCount": 1524,
  "livePlaybackEndFrame": 1524,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-140-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1524
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: glossary-host-bridge-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
