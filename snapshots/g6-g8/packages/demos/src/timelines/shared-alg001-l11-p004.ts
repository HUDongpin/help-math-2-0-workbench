import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-intro-terminal-tranche1-current-js-4-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/RW/L11RW04.swf",
    "sha256": "a32f55c8999b66f1a1c68ac377c9c05d2b16eba64b718bf745d3ad64ae0bff1f"
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

export const SHARED_ALG001_L11_P004_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p004",
  "title": "Page 3 — local-only ALG L11 intro-terminal tranche1 Current-JS candidate",
  "sourceSwfSha256": "a32f55c8999b66f1a1c68ac377c9c05d2b16eba64b718bf745d3ad64ae0bff1f",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p004/canvas-renderer.js",
  "assetSha256": "93505cb188ae0a8acddd1dab3f578b3713d39a6ceecb2778021fe91c1b846853",
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
  "mainFrameDomain": "sprite-335",
  "mainFrameCount": 1353,
  "livePlaybackEndFrame": 1353,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-335-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1353
    }
  ],
  "sourceControlBehaviorLabel": "ALG L11 source-bound explicit-source-terminal-stop candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
