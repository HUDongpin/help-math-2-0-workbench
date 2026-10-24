import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/RW/L6RW05.swf",
    "sha256": "b9b834c9acce6cbdc6afe8d6274940581bb6df79c69271836e2218ddfedb0209"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "pure-linear-source-static",
  "familyVisualPlaybackCalibrationPassed": true,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "embedded-audio-lifecycle-not-implemented"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L06_P005_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p005",
  "title": "Page 4 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "b9b834c9acce6cbdc6afe8d6274940581bb6df79c69271836e2218ddfedb0209",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p005/canvas-renderer.js",
  "assetSha256": "90d30b7aa2b59ab22996bd7f36a032409de4d5e9bcab49bd02e55bf20e575312",
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
  "mainFrameDomain": "sprite-446",
  "mainFrameCount": 536,
  "livePlaybackEndFrame": 536,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-446-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 536
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
