import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P023_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN11.swf",
    "sha256": "a2edf94347d394712b135da10b9384f124904ce469f57a94e941afa3be9faf58"
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

export const SHARED_ALG001_L09_P023_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p023",
  "title": "Using Scale — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "a2edf94347d394712b135da10b9384f124904ce469f57a94e941afa3be9faf58",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p023/canvas-renderer.js",
  "assetSha256": "695a181f90a43df16c9c01800a5b5ca84db384214b4687734efbaf06c2b27fef",
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
  "mainFrameDomain": "sprite-103",
  "mainFrameCount": 934,
  "livePlaybackEndFrame": 934,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-103-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 934
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
