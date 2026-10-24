import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P011_SOURCE = Object.freeze({
  "calibrationId": "g678-vb02-l1-current-js-11-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/VB/L6VB02.swf",
    "sha256": "69762676979cc7bd044cc66fdd9007bbad8eb8705192f290949b00a42198215f"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "vb02-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "vb02-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L06_P011_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p011",
  "title": "Formula — local-only VB-2 Current-JS candidate",
  "sourceSwfSha256": "69762676979cc7bd044cc66fdd9007bbad8eb8705192f290949b00a42198215f",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p011/canvas-renderer.js",
  "assetSha256": "e85755d53036224192ec842387b944b2663c792a14672b26bed9371fb9add351",
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
  "mainFrameDomain": "sprite-36",
  "mainFrameCount": 584,
  "livePlaybackEndFrame": 584,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-36-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 584
    }
  ],
  "sourceControlBehaviorLabel": "VB-2 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
