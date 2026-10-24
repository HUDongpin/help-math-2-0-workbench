import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L01_P055_SOURCE = Object.freeze({
  "calibrationId": "g678-fq01-current-js-calibration-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L1/FQ/L1FQ01.swf",
    "sha256": "b2fc65a0db946e1c261dd4a5622e05e1b9fd5466f0fc1a32144b92537350b3d5"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "final-quiz-intro-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "fq01-family-browser-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L01_P055_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l01-p055",
  "title": "Introduction — local-only FQ01 Current-JS candidate",
  "sourceSwfSha256": "b2fc65a0db946e1c261dd4a5622e05e1b9fd5466f0fc1a32144b92537350b3d5",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l01-p055/canvas-renderer.js",
  "assetSha256": "3f6df7ccd066b2cc932464e90fccaf78c024eb4b85bf264b00fa3d3706d69f13",
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
  "mainFrameDomain": "sprite-26",
  "mainFrameCount": 52,
  "livePlaybackEndFrame": 52,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-26-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 52
    }
  ],
  "sourceControlBehaviorLabel": "FQ01 representative awaiting browser product calibration.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
