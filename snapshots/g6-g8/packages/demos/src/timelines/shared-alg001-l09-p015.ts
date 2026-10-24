import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P015_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN03.swf",
    "sha256": "5b1b9540d2838458da307fb46955772fe15e3b0789b1e3f3acac0c79b3d07529"
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

export const SHARED_ALG001_L09_P015_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p015",
  "title": "Making Ratios — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "5b1b9540d2838458da307fb46955772fe15e3b0789b1e3f3acac0c79b3d07529",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p015/canvas-renderer.js",
  "assetSha256": "aa4c6bde35d1d351bc67b6a73d73a00658d140207d683540788cef14529f4275",
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
  "mainFrameDomain": "sprite-40",
  "mainFrameCount": 361,
  "livePlaybackEndFrame": 361,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-40-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 361
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
