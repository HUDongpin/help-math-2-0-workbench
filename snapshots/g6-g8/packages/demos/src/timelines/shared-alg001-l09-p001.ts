import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P001_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-intro-shell-linkage-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IR/L9IR01.swf",
    "sha256": "206af9838fc8f95f1c328a167e49445652fa3101ed88f6c120df25d79908e7c9"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-intro-shell-linkage-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-intro-shell-linkage-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P001_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p001",
  "title": "Introduction — local-only ALG L9 intro shell-linkage Current-JS candidate",
  "sourceSwfSha256": "206af9838fc8f95f1c328a167e49445652fa3101ed88f6c120df25d79908e7c9",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p001/canvas-renderer.js",
  "assetSha256": "48c8934576f9925def9d0f35727d290be823548c62305c8e7837b0159bff139a",
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
  "mainFrameDomain": "sprite-142",
  "mainFrameCount": 134,
  "livePlaybackEndFrame": 134,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-142-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 134
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 intro source-static candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
