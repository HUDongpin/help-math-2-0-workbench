import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P012_SOURCE = Object.freeze({
  "calibrationId": "g678-vb03-l1-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/VB/L6VB03.swf",
    "sha256": "b5923da4e814d1f921a30b51b40ac17817a98e7ddc6b582cfb00b614519b7a03"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "vb03-l1-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "vb03-l1-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L06_P012_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p012",
  "title": "Formula — local-only VB-3 Current-JS candidate",
  "sourceSwfSha256": "b5923da4e814d1f921a30b51b40ac17817a98e7ddc6b582cfb00b614519b7a03",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p012/canvas-renderer.js",
  "assetSha256": "4b5563fa93637303c0fd415f2115d5cf1cb51f749a93a3ff3d4c8875b44296c3",
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
  "mainFrameDomain": "sprite-29",
  "mainFrameCount": 451,
  "livePlaybackEndFrame": 451,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-29-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 451
    }
  ],
  "sourceControlBehaviorLabel": "VB-3 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
