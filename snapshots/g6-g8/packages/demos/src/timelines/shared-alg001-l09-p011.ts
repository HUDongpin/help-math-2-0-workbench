import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P011_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/VB/L9VB05.swf",
    "sha256": "13864876e6364ffa823c5b6567f5b18e93c45f1e378fd0a184e4ad36d5afecc3"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-simple-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-simple-glossary-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P011_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p011",
  "title": "Non-Proportional Relationship — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "13864876e6364ffa823c5b6567f5b18e93c45f1e378fd0a184e4ad36d5afecc3",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p011/canvas-renderer.js",
  "assetSha256": "1ccd6face5b1123a8f004553419af7cb80ba862f4edb7e6db1f9784b7c13d292",
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
  "mainFrameDomain": "sprite-63",
  "mainFrameCount": 935,
  "livePlaybackEndFrame": 935,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-63-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 935
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
