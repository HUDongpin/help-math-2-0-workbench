import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P050_SOURCE = Object.freeze({
  "calibrationId": "g678-ts05-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/TS/L3TS05.swf",
    "sha256": "89a6f921d4c3209d28fc9e9dbecdf599777510ce746fc1cc3c3a5164289820b5"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts05-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts05-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L03_P050_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p050",
  "title": "4 Step Plan — local-only TS05 Current-JS candidate",
  "sourceSwfSha256": "89a6f921d4c3209d28fc9e9dbecdf599777510ce746fc1cc3c3a5164289820b5",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p050/canvas-renderer.js",
  "assetSha256": "fe663d25e6cae8c1f33f17f4efb3d36674ba17856b91d9cad0e782f5285aa71f",
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
  "mainFrameDomain": "sprite-30",
  "mainFrameCount": 234,
  "livePlaybackEndFrame": 234,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-30-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 234
    }
  ],
  "sourceControlBehaviorLabel": "TS05 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
