import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P009_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-vb03-terminal-stop-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/VB/L9VB03.swf",
    "sha256": "8b05d18e797da4bfcbe1a653766bb66aa998735a0781b0c68ebc7f06006520ac"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-vb03-terminal-stop-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-vb03-terminal-stop-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P009_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p009",
  "title": "Proportion — local-only ALG L9 VB03 terminal-stop Current-JS candidate",
  "sourceSwfSha256": "8b05d18e797da4bfcbe1a653766bb66aa998735a0781b0c68ebc7f06006520ac",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p009/canvas-renderer.js",
  "assetSha256": "22f24933267cfde65eb94465479b3e79b46f3113ca2f003fc468202f51893a6a",
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
  "mainFrameDomain": "sprite-25",
  "mainFrameCount": 207,
  "livePlaybackEndFrame": 207,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-25-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 207
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 VB03 source-terminal-stop candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
