import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P025_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-ti-choice-current-js-6-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI03.swf",
    "sha256": "3269083d54867d5096200e5d971fb666783ab899ee2431e6918892b0357e034f"
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

export const SHARED_ALG001_L09_P025_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p025",
  "title": "Question 2 — local-only ALG L9 TI choice-quiz Current-JS candidate",
  "sourceSwfSha256": "3269083d54867d5096200e5d971fb666783ab899ee2431e6918892b0357e034f",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p025/canvas-renderer.js",
  "assetSha256": "7787b35d740b961226693ca8141ebcdb259cbf57864a7eaa720b94fbc57d8aec",
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
  "mainFrameDomain": "sprite-362",
  "mainFrameCount": 288,
  "livePlaybackEndFrame": 288,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-362-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 288
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 TI source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
