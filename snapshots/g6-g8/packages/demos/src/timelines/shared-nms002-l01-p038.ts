import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L01_P038_SOURCE = Object.freeze({
  "calibrationId": "g678-ts02-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L1/TS/L1TS02.swf",
    "sha256": "a6fd25e774af5ddf093b1da130275ca23bcb1a6b355c148ab888c32422da7898"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_NMS002_L01_P038_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l01-p038",
  "title": "4 Step Plan — local-only TS02 Current-JS candidate",
  "sourceSwfSha256": "a6fd25e774af5ddf093b1da130275ca23bcb1a6b355c148ab888c32422da7898",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l01-p038/canvas-renderer.js",
  "assetSha256": "9561042ef6cd6b25e7bb9e488526fd7f03913497e8121a5d2d3b9412a341f57f",
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
  "mainFrameDomain": "sprite-27",
  "mainFrameCount": 354,
  "livePlaybackEndFrame": 354,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-27-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 354
    }
  ],
  "sourceControlBehaviorLabel": "TS02 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
