import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P051_SOURCE = Object.freeze({
  "calibrationId": "g678-ts02-l1-current-js-15-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/TS/L6TS02.swf",
    "sha256": "5a44d21e5e0a034f3778a8873dc3b3aef6a9887861a47a5032ae3d2cf1202c36"
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

export const SHARED_ALG001_L06_P051_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p051",
  "title": "4 Step Plan — local-only TS02 Current-JS candidate",
  "sourceSwfSha256": "5a44d21e5e0a034f3778a8873dc3b3aef6a9887861a47a5032ae3d2cf1202c36",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p051/canvas-renderer.js",
  "assetSha256": "ef1ec3e1a635d655646ef6e4eee1cc0abd123da3b2cd205ed4cdf86cb7b98fab",
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
  "mainFrameDomain": "sprite-26",
  "mainFrameCount": 337,
  "livePlaybackEndFrame": 337,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-26-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 337
    }
  ],
  "sourceControlBehaviorLabel": "TS02 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
