import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P010_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/VB/L9VB04.swf",
    "sha256": "382a32cf6f28e548de2a6028943597c5a7f732010098cb91a12eb6c99ccd8abf"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-simple-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-simple-glossary-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P010_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p010",
  "title": "Proportional Relationship — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "382a32cf6f28e548de2a6028943597c5a7f732010098cb91a12eb6c99ccd8abf",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p010/canvas-renderer.js",
  "assetSha256": "d103bca7b983ea31d3ee172dbb5742cb3b42bae57b46a114f95d2c2cf7355660",
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
  "mainFrameDomain": "sprite-59",
  "mainFrameCount": 639,
  "livePlaybackEndFrame": 639,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-59-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 639
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
