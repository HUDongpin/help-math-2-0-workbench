import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L01_P001_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L1/IR/L1IR01.swf",
    "sha256": "9cb2f39f0f33fbf7a100f1f306424051864d932c7107b97649e88ae3253203c6"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "intro-fui-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-dat001-l01-p001/canvas-renderer.js",
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

export const SHARED_DAT001_L01_P001_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l01-p001",
  "title": "Introduction — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "9cb2f39f0f33fbf7a100f1f306424051864d932c7107b97649e88ae3253203c6",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l01-p001/canvas-renderer.js",
  "assetSha256": "79025f8de4259e1e7e2daffc8529e7f487d8252aa36e66b8084476e8fd5400a8",
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
  "mainFrameDomain": "sprite-133",
  "mainFrameCount": 136,
  "livePlaybackEndFrame": 136,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-133-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 136
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: intro-fui-scroll-behavior-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
