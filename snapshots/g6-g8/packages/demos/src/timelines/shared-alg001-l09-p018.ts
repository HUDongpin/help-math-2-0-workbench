import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P018_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-in06-choice-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN06.swf",
    "sha256": "da5717b3f89a31869125193f91ebd081f4b49737a763b61954affd68777269e0"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-in06-choice-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-in06-choice-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P018_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p018",
  "title": "Simplifying Ratios — local-only ALG L9 IN06 choice-quiz Current-JS candidate",
  "sourceSwfSha256": "da5717b3f89a31869125193f91ebd081f4b49737a763b61954affd68777269e0",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p018/canvas-renderer.js",
  "assetSha256": "a9abd2b5887eb3071a35ca8c385692e98535131b7a70fa4fa59354c65b040366",
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
  "mainFrameDomain": "sprite-189",
  "mainFrameCount": 667,
  "livePlaybackEndFrame": 667,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-189-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 667
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 IN06 source-choice-quiz candidate awaiting browser product calibration; choice-feedback audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
