import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P008_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-vb02-glossary-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/VB/L9VB02.swf",
    "sha256": "49389001247ce8e721f21d3ea5ec36bfac47ae6b8685eed4c693fea39674c57b"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-vb02-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-vb02-glossary-browser-product-calibration-pending",
    "dormant-child-random-feedback-audio-runtime-and-listening-acceptance-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P008_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p008",
  "title": "Ratio definition and notation — local-only ALG L9 VB02 glossary Current-JS candidate",
  "sourceSwfSha256": "49389001247ce8e721f21d3ea5ec36bfac47ae6b8685eed4c693fea39674c57b",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p008/canvas-renderer.js",
  "assetSha256": "ff73b4f24b0abb9f5becb83ed781b04fcb91768f8a7a998e5e4f8c9b21126f59",
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
  "mainFrameDomain": "sprite-187",
  "mainFrameCount": 505,
  "livePlaybackEndFrame": 505,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-187-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 505
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 VB02 typed glossary candidate awaiting browser product calibration; dormant child audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
