import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P020_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-in08-choice-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN08.swf",
    "sha256": "a5c7d7930edb3905124a7b7d7cf08596edc48066f618f932693b7e37c8e199e9"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-in08-choice-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-in08-choice-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P020_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p020",
  "title": "Solving Proportions — local-only ALG L9 IN08 choice-quiz Current-JS candidate",
  "sourceSwfSha256": "a5c7d7930edb3905124a7b7d7cf08596edc48066f618f932693b7e37c8e199e9",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p020/canvas-renderer.js",
  "assetSha256": "8a01b984fa19e243616784145c6179a7a3e698dcf9319a229abca31d41d0f286",
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
  "mainFrameDomain": "sprite-193",
  "mainFrameCount": 1271,
  "livePlaybackEndFrame": 1271,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-193-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1271
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 IN08 source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
