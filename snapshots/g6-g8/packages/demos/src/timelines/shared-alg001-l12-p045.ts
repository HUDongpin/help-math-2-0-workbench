import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P045_SOURCE = Object.freeze({
  "calibrationId": "g678-ts04-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/TS/L12TS04.swf",
    "sha256": "b61ca224e4fef94fc204edc619c70226586a978dccda30a808399092ea2fb63e"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts04-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts04-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L12_P045_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p045",
  "title": "4 Step Plan — local-only TS04 Current-JS candidate",
  "sourceSwfSha256": "b61ca224e4fef94fc204edc619c70226586a978dccda30a808399092ea2fb63e",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p045/canvas-renderer.js",
  "assetSha256": "b00292fb31e8c3e8233036578dd4f91ca3bfdd644011063d8f1a25fd99fa0b3e",
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
  "mainFrameDomain": "sprite-36",
  "mainFrameCount": 282,
  "livePlaybackEndFrame": 282,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-36-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 282
    }
  ],
  "sourceControlBehaviorLabel": "TS04 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
