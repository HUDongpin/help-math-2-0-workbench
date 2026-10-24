import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P041_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-game-assessment-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/FQ/L9FQ02.swf",
    "sha256": "a3706178cef1f10fd9d99c430114951bd1c9a07f9c16fc6e66c1d906b6e86af8"
  },
  "reviewedLane": "behavior-heavy",
  "adapterFamily": "advanced-manual-alg-l09-final-assessment-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-game-assessment-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P041_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p041",
  "title": "Page 1 — local-only ALG L9 game assessment Current-JS candidate",
  "sourceSwfSha256": "a3706178cef1f10fd9d99c430114951bd1c9a07f9c16fc6e66c1d906b6e86af8",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p041/canvas-renderer.js",
  "assetSha256": "48c935fbd69ce19bd496ef998107cfcc77aa4189a25a45a13858a58bb5bb524e",
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
  "mainFrameDomain": "sprite-855",
  "mainFrameCount": 69,
  "livePlaybackEndFrame": 69,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-855-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 69
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-game/assessment candidate awaiting browser product calibration; feedback/audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
