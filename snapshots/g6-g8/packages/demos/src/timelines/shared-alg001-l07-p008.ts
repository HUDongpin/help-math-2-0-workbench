import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L07_P008_SOURCE = Object.freeze({
  "calibrationId": "g678-vb03-l1-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L7/VB/L7VB03.swf",
    "sha256": "6b26f8a39c2a9c3eb0029184d6498c11ccd43d8b17bf0ed008b62195ca12116a"
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

export const SHARED_ALG001_L07_P008_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l07-p008",
  "title": "Linear Equation — local-only VB-3 Current-JS candidate",
  "sourceSwfSha256": "6b26f8a39c2a9c3eb0029184d6498c11ccd43d8b17bf0ed008b62195ca12116a",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l07-p008/canvas-renderer.js",
  "assetSha256": "e906b352899b83242cf73cbeb119d6dfffb637abc191ce736ede7e277ecbcd67",
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
  "mainFrameDomain": "sprite-35",
  "mainFrameCount": 493,
  "livePlaybackEndFrame": 493,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-35-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 493
    }
  ],
  "sourceControlBehaviorLabel": "VB-3 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
