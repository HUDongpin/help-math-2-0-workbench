import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L01_P001_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L1/IR/L1IR01.swf",
    "sha256": "714ecfc1cca2d49766c43c107337c7ef1996122d40073721ee67529cf89f9dd3"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "intro-fui-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-nms002-l01-p001/canvas-renderer.js",
  "productBlockers": [
    "intro-fui-scroll-behavior-not-reconstructed",
    "embedded-audio-lifecycle-not-implemented"
  ],
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "actionScriptExecuted": false,
  "nestedAudioPlaybackCompiled": false,
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_NMS002_L01_P001_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l01-p001",
  "title": "Introduction — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "714ecfc1cca2d49766c43c107337c7ef1996122d40073721ee67529cf89f9dd3",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l01-p001/canvas-renderer.js",
  "assetSha256": "ead3294ace3ea9a66160f3dffdd11cef9bcc4aada4ab3bb463587b65309d8a5e",
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
  "mainFrameDomain": "sprite-113",
  "mainFrameCount": 136,
  "livePlaybackEndFrame": 136,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-113-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 136
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: intro-fui-scroll-behavior-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
