import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P030_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-game-assessment-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/GS/L9GS02.swf",
    "sha256": "490bf1270ebaae387784e73c196646da73db623789574e107ef86734d2f238e9"
  },
  "reviewedLane": "behavior-heavy",
  "adapterFamily": "advanced-manual-alg-l09-game-controller-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-game-assessment-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P030_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p030",
  "title": "Game 1 — local-only ALG L9 game assessment Current-JS candidate",
  "sourceSwfSha256": "490bf1270ebaae387784e73c196646da73db623789574e107ef86734d2f238e9",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p030/canvas-renderer.js",
  "assetSha256": "2d5e64305abee9d4c160a0708d948afacd575ca6f07bbc3a71ed61d65f73dbe8",
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
  "mainFrameDomain": "sprite-140",
  "mainFrameCount": 749,
  "livePlaybackEndFrame": 749,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-140-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 749
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-game/assessment candidate awaiting browser product calibration; feedback/audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
