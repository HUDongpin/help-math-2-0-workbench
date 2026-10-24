import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L02_P020_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L2/IN/L2IN05.swf",
    "sha256": "5aaf739cf2ef1b093564d0f64d3799dcfca2ab5ffa7cc0375f4c0b43dc3364b5"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "hover-glossary-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-nms002-l02-p020/canvas-renderer.js",
  "productBlockers": [
    "twelve-hover-reveal-controls-not-reconstructed",
    "glossary-host-bridge-not-reconstructed",
    "embedded-audio-lifecycle-not-implemented"
  ],
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "actionScriptExecuted": false,
  "nestedAudioPlaybackCompiled": false,
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_NMS002_L02_P020_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l02-p020",
  "title": "Naming Fractions — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "5aaf739cf2ef1b093564d0f64d3799dcfca2ab5ffa7cc0375f4c0b43dc3364b5",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l02-p020/canvas-renderer.js",
  "assetSha256": "1689bc6984240eaacb958f11498e49f0364ea29498d02535cb138fdddb3707bc",
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
  "mainFrameDomain": "sprite-69",
  "mainFrameCount": 151,
  "livePlaybackEndFrame": 151,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-69-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 151
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: twelve-hover-reveal-controls-not-reconstructed, glossary-host-bridge-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
