import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L10_P008_SOURCE = Object.freeze({
  "calibrationId": "g678-vb03-l1-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L10/VB/L10VB03.swf",
    "sha256": "4667eb527f9f4c19613996ecc39a85ecbe2ff4c2f9bb22b4939a7aaf979ca27e"
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

export const SHARED_ALG001_L10_P008_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l10-p008",
  "title": "Power/Exponent Review — local-only VB-3 Current-JS candidate",
  "sourceSwfSha256": "4667eb527f9f4c19613996ecc39a85ecbe2ff4c2f9bb22b4939a7aaf979ca27e",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l10-p008/canvas-renderer.js",
  "assetSha256": "922fd447f93a9ec32c6ba2ea989e7b326e0627caef6ac92885b92972a176ce85",
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
  "mainFrameCount": 348,
  "livePlaybackEndFrame": 348,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-26-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 348
    }
  ],
  "sourceControlBehaviorLabel": "VB-3 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
