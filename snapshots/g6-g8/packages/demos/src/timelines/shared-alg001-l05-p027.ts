import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L05_P027_SOURCE = Object.freeze({
  "calibrationId": "g678-in02-l1-current-js-13-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L5/IN/L5IN02.swf",
    "sha256": "63d6a47b8dc4c77dfee15c897c7a2d3b688782e650bdd68f36f811496b988fb3"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "in02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "in02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L05_P027_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l05-p027",
  "title": "Identifying Like Terms — local-only IN-1 Current-JS candidate",
  "sourceSwfSha256": "63d6a47b8dc4c77dfee15c897c7a2d3b688782e650bdd68f36f811496b988fb3",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l05-p027/canvas-renderer.js",
  "assetSha256": "52f8d33baf41fc172eebb7c067ac4cc3dea4983de6a8f29027346a804afa4bc2",
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
  "mainFrameDomain": "sprite-32",
  "mainFrameCount": 873,
  "livePlaybackEndFrame": 873,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-32-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 873
    }
  ],
  "sourceControlBehaviorLabel": "IN-1 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
