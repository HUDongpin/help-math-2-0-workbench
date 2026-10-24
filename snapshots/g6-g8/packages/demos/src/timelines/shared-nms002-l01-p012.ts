import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L01_P012_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L1/IN/L1IN02.swf",
    "sha256": "e7f384d6f59446b63685e4578a747ff7b1aa411653f24bf503339a959e510769"
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

export const SHARED_NMS002_L01_P012_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l01-p012",
  "title": "Integers — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "e7f384d6f59446b63685e4578a747ff7b1aa411653f24bf503339a959e510769",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l01-p012/canvas-renderer.js",
  "assetSha256": "db87873ac48a0cd1708852ce59b583a38bb7f78c81a285bb836fbba392645b00",
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
  "mainFrameDomain": "sprite-54",
  "mainFrameCount": 644,
  "livePlaybackEndFrame": 644,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-54-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 644
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
