import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P008_SOURCE = Object.freeze({
  "calibrationId": "g678-vb03-l1-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/VB/L12VB03.swf",
    "sha256": "9dfdd945e206ce5cb4d3e01ce5115b8a0ede8903fc5f7ad3901db72a2eaa126c"
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

export const SHARED_ALG001_L12_P008_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p008",
  "title": "Reviewing x- and y-axis — local-only VB-3 Current-JS candidate",
  "sourceSwfSha256": "9dfdd945e206ce5cb4d3e01ce5115b8a0ede8903fc5f7ad3901db72a2eaa126c",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p008/canvas-renderer.js",
  "assetSha256": "e68a8b52ace0e9f0f0208cca81bd2f94f6c369024233aa0609cc76b25544b87a",
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
  "mainFrameDomain": "sprite-48",
  "mainFrameCount": 114,
  "livePlaybackEndFrame": 114,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-48-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 114
    }
  ],
  "sourceControlBehaviorLabel": "VB-3 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
