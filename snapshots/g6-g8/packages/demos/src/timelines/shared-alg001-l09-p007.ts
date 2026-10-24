import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P007_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-terminal-stop-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/RW/L9RW07.swf",
    "sha256": "ef3b4963c4c988c4d570a15a2f59d9cce5c450e672c855c1c3aa1ab5b7630b2b"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-terminal-stop-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-terminal-stop-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P007_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p007",
  "title": "Page 6 — local-only ALG L9 terminal-stop Current-JS candidate",
  "sourceSwfSha256": "ef3b4963c4c988c4d570a15a2f59d9cce5c450e672c855c1c3aa1ab5b7630b2b",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p007/canvas-renderer.js",
  "assetSha256": "565e849c8ecb5c016c9f758447ae3b01ab32f5a233793563fbe8c87afef7507b",
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
  "mainFrameDomain": "sprite-38",
  "mainFrameCount": 485,
  "livePlaybackEndFrame": 485,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-38-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 485
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-terminal-stop candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
