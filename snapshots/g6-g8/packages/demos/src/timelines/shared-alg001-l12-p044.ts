import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P044_SOURCE = Object.freeze({
  "calibrationId": "g678-ts03-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/TS/L12TS03.swf",
    "sha256": "d0b8aae4843b711a56cbfbdc2c24ac31fe4d49aeff29c52e49d7eac656d7c732"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts03-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts03-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L12_P044_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p044",
  "title": "4 Step Plan — local-only TS03 Current-JS candidate",
  "sourceSwfSha256": "d0b8aae4843b711a56cbfbdc2c24ac31fe4d49aeff29c52e49d7eac656d7c732",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p044/canvas-renderer.js",
  "assetSha256": "d97ca306f936af675e87b2ef74ad0d3d23d52647b39ffbc4ea97a1ed05638429",
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
  "mainFrameDomain": "sprite-25",
  "mainFrameCount": 223,
  "livePlaybackEndFrame": 223,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-25-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 223
    }
  ],
  "sourceControlBehaviorLabel": "TS03 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
