import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L01_P018_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L1/IN/L1IN02.swf",
    "sha256": "5bb8ee8c351cfa0b9fbc48e804a1e3045c8659fb8c4e24d2e4f0d39321c75609"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "in02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "in02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_DAT001_L01_P018_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l01-p018",
  "title": "Data, Range — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "5bb8ee8c351cfa0b9fbc48e804a1e3045c8659fb8c4e24d2e4f0d39321c75609",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l01-p018/canvas-renderer.js",
  "assetSha256": "66b89e4e3ef6a61af5a3c22ce030e600fdc0e93b962570b0c6f5f69eabecfa12",
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
  "mainFrameDomain": "sprite-48",
  "mainFrameCount": 624,
  "livePlaybackEndFrame": 624,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-48-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 624
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
