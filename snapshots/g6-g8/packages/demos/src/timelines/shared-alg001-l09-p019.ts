import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P019_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN07.swf",
    "sha256": "bbe503704cf2e5f1c63efbb50fe2351e0cd44d47b4c26afbd95bf512c70eee69"
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

export const SHARED_ALG001_L09_P019_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p019",
  "title": "Solving Proportions — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "bbe503704cf2e5f1c63efbb50fe2351e0cd44d47b4c26afbd95bf512c70eee69",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p019/canvas-renderer.js",
  "assetSha256": "07e31548c0ff7d5c9512a56560189264ff8e269151a6a7dcc432111a2bd41f4d",
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
  "mainFrameDomain": "sprite-38",
  "mainFrameCount": 927,
  "livePlaybackEndFrame": 927,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-38-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 927
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
