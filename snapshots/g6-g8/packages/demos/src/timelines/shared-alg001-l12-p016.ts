import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P016_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/IN/L12IN02.swf",
    "sha256": "0df4a0ade8071d147b4668196220473e865358a2542de59d239c08a677cdde5b"
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

export const SHARED_ALG001_L12_P016_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p016",
  "title": "Coordinate Plane — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "0df4a0ade8071d147b4668196220473e865358a2542de59d239c08a677cdde5b",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p016/canvas-renderer.js",
  "assetSha256": "5ca45e571ace84e15ebd9d8308e7d9df1399a088b29400067632223192efb0b7",
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
  "mainFrameDomain": "sprite-79",
  "mainFrameCount": 433,
  "livePlaybackEndFrame": 433,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-79-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 433
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
