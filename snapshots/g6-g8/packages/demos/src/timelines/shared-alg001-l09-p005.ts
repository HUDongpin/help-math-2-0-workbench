import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/RW/L9RW05.swf",
    "sha256": "41ca7e111ac5dbe32fddaef601e1263f546d106bd5d830bed20f94b9cfc4b5aa"
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

export const SHARED_ALG001_L09_P005_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p005",
  "title": "Page 4 — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "41ca7e111ac5dbe32fddaef601e1263f546d106bd5d830bed20f94b9cfc4b5aa",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p005/canvas-renderer.js",
  "assetSha256": "a0f9b72874cd5d6e949a42365dc975f8fa5940ebf69ad1c482248753769b8e9a",
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
  "mainFrameDomain": "sprite-66",
  "mainFrameCount": 688,
  "livePlaybackEndFrame": 688,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-66-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 688
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
