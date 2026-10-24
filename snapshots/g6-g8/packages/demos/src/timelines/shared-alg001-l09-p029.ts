import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P029_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-ti-choice-current-js-6-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI07.swf",
    "sha256": "ac11180dc224772d864fa318072dd29a465c94f78e74305eec70c9b3ac7af12c"
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

export const SHARED_ALG001_L09_P029_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p029",
  "title": "Question 6 — local-only ALG L9 TI choice-quiz Current-JS candidate",
  "sourceSwfSha256": "ac11180dc224772d864fa318072dd29a465c94f78e74305eec70c9b3ac7af12c",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p029/canvas-renderer.js",
  "assetSha256": "3f886626e83c4d17bc369a982283f08e1dddf6b6f4fae2dbe92523167ed7e9bb",
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
  "mainFrameDomain": "sprite-383",
  "mainFrameCount": 511,
  "livePlaybackEndFrame": 511,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-383-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 511
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 TI source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
