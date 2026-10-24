import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P026_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-ti-choice-current-js-6-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI04.swf",
    "sha256": "66a6b74f351f9f58df17862f2e482dd1406a8b8f974aab1dd9b093b4fc8234a9"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-ti-choice-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-ti-choice-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P026_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p026",
  "title": "Question 3 — local-only ALG L9 TI choice-quiz Current-JS candidate",
  "sourceSwfSha256": "66a6b74f351f9f58df17862f2e482dd1406a8b8f974aab1dd9b093b4fc8234a9",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p026/canvas-renderer.js",
  "assetSha256": "953916ef6d3e5550bf815fa76a0c3c195e8ad9c39cf7ff85fa4483cbd16db120",
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
  "mainFrameDomain": "sprite-336",
  "mainFrameCount": 731,
  "livePlaybackEndFrame": 731,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-336-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 731
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 TI source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
