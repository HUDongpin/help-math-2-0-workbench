import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P003_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l11-intro-terminal-tranche1-current-js-4-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/RW/L11RW03.swf",
    "sha256": "24bc122e87f033486f16119de52db199dbeca383afc3f1981f0f294e5d7336cf"
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

export const SHARED_ALG001_L11_P003_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p003",
  "title": "Page 2 — local-only ALG L11 intro-terminal tranche1 Current-JS candidate",
  "sourceSwfSha256": "24bc122e87f033486f16119de52db199dbeca383afc3f1981f0f294e5d7336cf",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p003/canvas-renderer.js",
  "assetSha256": "347619966bf9d7eabd61bc3f3320c229b23f8892ed422a410e2522db8d025b0d",
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
  "mainFrameDomain": "sprite-385",
  "mainFrameCount": 1701,
  "livePlaybackEndFrame": 1701,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-385-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1701
    }
  ],
  "sourceControlBehaviorLabel": "ALG L11 source-bound no-explicit-source-terminal-stop-modern-once-clamp candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
