import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/VB/L11VB02.swf",
    "sha256": "a84d6c4168d59f708e53a7fbf335d5d8f604c4d7397f2369dab933b95b065eb7"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "vb02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "vb02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L11_P005_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p005",
  "title": "Inequality — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "a84d6c4168d59f708e53a7fbf335d5d8f604c4d7397f2369dab933b95b065eb7",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p005/canvas-renderer.js",
  "assetSha256": "eec86fccd659a53387442fdf352a58a146a21e4b302446828b9f78ed13ba5c94",
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
  "mainFrameDomain": "sprite-43",
  "mainFrameCount": 602,
  "livePlaybackEndFrame": 602,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-43-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 602
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
