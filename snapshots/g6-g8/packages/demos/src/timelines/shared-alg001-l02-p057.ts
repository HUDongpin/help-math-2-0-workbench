import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L02_P057_SOURCE = Object.freeze({
  "calibrationId": "g678-fq01-current-js-scaleout-43-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L2/FQ/L2FQ01.swf",
    "sha256": "b2fc65a0db946e1c261dd4a5622e05e1b9fd5466f0fc1a32144b92537350b3d5"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "final-quiz-intro-source-static",
  "familyVisualPlaybackCalibrationPassed": true,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L02_P057_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l02-p057",
  "title": "Introduction — local-only FQ01 Current-JS candidate",
  "sourceSwfSha256": "b2fc65a0db946e1c261dd4a5622e05e1b9fd5466f0fc1a32144b92537350b3d5",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l02-p057/canvas-renderer.js",
  "assetSha256": "3e5b961439098fe0a8556b6a1fc453f0859300cffeaa8c9afd59c4864953d557",
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
  "sourceControlBehaviorLabel": "FQ01 visual playback family calibrated; acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
