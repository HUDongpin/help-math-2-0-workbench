import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L01_P001_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L1/IR/L1IR01.swf",
    "sha256": "cd5d73e2aed3214c547dd7758d0201905ce39e7cc0dcfc6d6473ca177d764650"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "intro-fui-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-alg001-l01-p001/canvas-renderer.js",
  "productBlockers": [
    "intro-fui-component-behavior-not-reconstructed",
    "embedded-audio-lifecycle-not-implemented"
  ],
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "actionScriptExecuted": false,
  "nestedAudioPlaybackCompiled": false,
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L01_P001_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l01-p001",
  "title": "Introduction — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "cd5d73e2aed3214c547dd7758d0201905ce39e7cc0dcfc6d6473ca177d764650",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l01-p001/canvas-renderer.js",
  "assetSha256": "56bc34a09d3f5127bd8ed440c8b4f65534cee27bbd8d6fbca13c2d2494460d1b",
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
  "mainFrameDomain": "sprite-83",
  "mainFrameCount": 135,
  "livePlaybackEndFrame": 135,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-83-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 135
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: intro-fui-component-behavior-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
