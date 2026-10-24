import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P001_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-intro-terminal-tranche1-current-js-4-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IR/L11IR01.swf",
    "sha256": "6f1241891006db46f31705a0eb721d556c30b7237f3ddfdf9a309208115ac5a0"
  },
  "reviewedLane": "low",
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

export const SHARED_ALG001_L11_P001_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p001",
  "title": "Introduction — local-only ALG L11 intro-terminal tranche1 Current-JS candidate",
  "sourceSwfSha256": "6f1241891006db46f31705a0eb721d556c30b7237f3ddfdf9a309208115ac5a0",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p001/canvas-renderer.js",
  "assetSha256": "dba62c229fb7c7f2439b08653ce8659c12d71591eb496e70e5b77f58feb6f36e",
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
  "mainFrameDomain": "sprite-142",
  "mainFrameCount": 130,
  "livePlaybackEndFrame": 130,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-142-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 130
    }
  ],
  "sourceControlBehaviorLabel": "ALG L11 source-bound script-free-intro-modern-once-clamp candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
