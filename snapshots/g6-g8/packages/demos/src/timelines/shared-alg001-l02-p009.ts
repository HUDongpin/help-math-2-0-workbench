import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L02_P009_SOURCE = Object.freeze({
  "calibrationId": "g678-vb03-l1-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L2/VB/L2VB03.swf",
    "sha256": "8c52ebc8b9ec47f4b949c917c18b32bd1f050f63b7dff58da307090ad7379d03"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "vb03-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "vb03-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L02_P009_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l02-p009",
  "title": "Variable — local-only VB-3 Current-JS candidate",
  "sourceSwfSha256": "8c52ebc8b9ec47f4b949c917c18b32bd1f050f63b7dff58da307090ad7379d03",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l02-p009/canvas-renderer.js",
  "assetSha256": "74cde0957b538023983f7aa677ecbc00852fdc46c7950829e9df0fed4b87f9fd",
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
  "mainFrameDomain": "sprite-37",
  "mainFrameCount": 450,
  "livePlaybackEndFrame": 450,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-37-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 450
    }
  ],
  "sourceControlBehaviorLabel": "VB-3 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
