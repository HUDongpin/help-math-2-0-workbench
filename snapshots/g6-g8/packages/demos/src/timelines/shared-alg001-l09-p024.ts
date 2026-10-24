import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P024_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-ti-choice-current-js-6-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI02.swf",
    "sha256": "9c04f29855a05de5a3bc84418416449898f9ac179fc8012418c018391cadc377"
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

export const SHARED_ALG001_L09_P024_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p024",
  "title": "Question 1 — local-only ALG L9 TI choice-quiz Current-JS candidate",
  "sourceSwfSha256": "9c04f29855a05de5a3bc84418416449898f9ac179fc8012418c018391cadc377",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p024/canvas-renderer.js",
  "assetSha256": "4cefb50b888b12ae0a1c169d84cb1be6381afab36881e4b5f0eb3e53d8bf368d",
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
  "mainFrameDomain": "sprite-345",
  "mainFrameCount": 352,
  "livePlaybackEndFrame": 352,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-345-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 352
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 TI source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
