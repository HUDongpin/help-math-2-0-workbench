import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P013_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/VB/L9VB07.swf",
    "sha256": "ffe625b2b429d55c25a9b9e02ab185196442d21940e7daa83bab00bc93ba775f"
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

export const SHARED_ALG001_L09_P013_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p013",
  "title": "Scale — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "ffe625b2b429d55c25a9b9e02ab185196442d21940e7daa83bab00bc93ba775f",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p013/canvas-renderer.js",
  "assetSha256": "29cfc53473fbad563ba41cf062aceef595858960ceb18244744ac87dc15e1c30",
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
  "mainFrameDomain": "sprite-60",
  "mainFrameCount": 355,
  "livePlaybackEndFrame": 355,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-60-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 355
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
