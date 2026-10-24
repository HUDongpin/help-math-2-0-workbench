import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P027_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-ti-choice-current-js-6-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI05.swf",
    "sha256": "d6937e6307b373fa3e2b329648386fe54a2f23161bc62927481e5c42cb5ec2e4"
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

export const SHARED_ALG001_L09_P027_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p027",
  "title": "Question 4 — local-only ALG L9 TI choice-quiz Current-JS candidate",
  "sourceSwfSha256": "d6937e6307b373fa3e2b329648386fe54a2f23161bc62927481e5c42cb5ec2e4",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p027/canvas-renderer.js",
  "assetSha256": "51ef137cec6ebe6717431c6abc22a607232f707e88998cc91f52733d6a5d33bd",
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
  "mainFrameCount": 548,
  "livePlaybackEndFrame": 548,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-383-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 548
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 TI source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
