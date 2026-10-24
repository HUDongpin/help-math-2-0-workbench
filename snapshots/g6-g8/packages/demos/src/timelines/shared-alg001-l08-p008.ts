import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L08_P008_SOURCE = Object.freeze({
  "calibrationId": "g678-vb03-l1-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L8/VB/L8VB03.swf",
    "sha256": "c0eb7da2f7c6079e146699b9acebb7025181d57b480070f6122337b6f06fa6d9"
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

export const SHARED_ALG001_L08_P008_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l08-p008",
  "title": "Slope — local-only VB-3 Current-JS candidate",
  "sourceSwfSha256": "c0eb7da2f7c6079e146699b9acebb7025181d57b480070f6122337b6f06fa6d9",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l08-p008/canvas-renderer.js",
  "assetSha256": "b559cdfb7022e403d9aa4cbff2a50a04975d991e5bfb2bb902e8f440cca4e277",
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
  "mainFrameCount": 246,
  "livePlaybackEndFrame": 246,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-54-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 246
    }
  ],
  "sourceControlBehaviorLabel": "VB-3 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
