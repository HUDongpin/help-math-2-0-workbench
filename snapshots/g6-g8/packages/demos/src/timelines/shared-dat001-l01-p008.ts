import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L01_P008_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L1/VB/L1VB02.swf",
    "sha256": "65685c5a14f752ceef19303551ef123e402716103a0f1f352ef65e1ef9256227"
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

export const SHARED_DAT001_L01_P008_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l01-p008",
  "title": "Range — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "65685c5a14f752ceef19303551ef123e402716103a0f1f352ef65e1ef9256227",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l01-p008/canvas-renderer.js",
  "assetSha256": "969ca0c06d72d7014a8e2b51535d559e37c8a2adaeb19458bea891088b44ee80",
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
  "mainFrameDomain": "sprite-68",
  "mainFrameCount": 551,
  "livePlaybackEndFrame": 551,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-68-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 551
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
