import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P047_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/TS/L12TS06.swf",
    "sha256": "860572093b418cc7cd51bb7454651e39c9c9cfa174e6310d6676ec541b5385e0"
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

export const SHARED_ALG001_L12_P047_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p047",
  "title": "4 Step Plan — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "860572093b418cc7cd51bb7454651e39c9c9cfa174e6310d6676ec541b5385e0",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p047/canvas-renderer.js",
  "assetSha256": "feb1310894f4aa1e92b662ca94792e454b23c3c81169c71306f8c61a5d58674d",
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
  "mainFrameDomain": "sprite-12",
  "mainFrameCount": 245,
  "livePlaybackEndFrame": 245,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-12-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 245
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
