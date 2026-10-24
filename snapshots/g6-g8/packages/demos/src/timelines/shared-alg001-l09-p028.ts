import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P028_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-ti-choice-current-js-6-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI06.swf",
    "sha256": "a7cf64d6f2d24533cc496e1605dc9fe8753650c72350a79a07ce9a1e99a0d728"
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

export const SHARED_ALG001_L09_P028_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p028",
  "title": "Question 5 — local-only ALG L9 TI choice-quiz Current-JS candidate",
  "sourceSwfSha256": "a7cf64d6f2d24533cc496e1605dc9fe8753650c72350a79a07ce9a1e99a0d728",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p028/canvas-renderer.js",
  "assetSha256": "51cddf3d6c4224e0460fa2e0ad7e41ac39d36d757e5b1abb0c342b78e7091526",
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
  "mainFrameCount": 588,
  "livePlaybackEndFrame": 588,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-345-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 588
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 TI source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
