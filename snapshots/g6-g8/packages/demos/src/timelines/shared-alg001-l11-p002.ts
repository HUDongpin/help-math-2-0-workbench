import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-intro-terminal-tranche1-current-js-4-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/RW/L11RW02.swf",
    "sha256": "698fa2343d3578994ab8313d55b8102f381c710573d48829bfc98d64a4c96300"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l11-intro-terminal-tranche1-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "registrationCandidate": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l11-intro-terminal-tranche1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L11_P002_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p002",
  "title": "Page 1 — local-only ALG L11 intro-terminal tranche1 Current-JS candidate",
  "sourceSwfSha256": "698fa2343d3578994ab8313d55b8102f381c710573d48829bfc98d64a4c96300",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p002/canvas-renderer.js",
  "assetSha256": "2662b119f166ebdbbf463158f122acbcb1c0fe98f5086e6e14758454373424c8",
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
  "mainFrameDomain": "sprite-203",
  "mainFrameCount": 780,
  "livePlaybackEndFrame": 780,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-203-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 780
    }
  ],
  "sourceControlBehaviorLabel": "ALG L11 source-bound explicit-source-terminal-stop candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
