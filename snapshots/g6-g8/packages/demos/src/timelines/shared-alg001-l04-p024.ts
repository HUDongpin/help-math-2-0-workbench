import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L04_P024_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L4/IN/L4IN10.swf",
    "sha256": "d7c91cf8b28e956dfaf53d6c20dcf18dca87edf866f11247fa0b480080552312"
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

export const SHARED_ALG001_L04_P024_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l04-p024",
  "title": "Writing algebraic expressions for functions — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "d7c91cf8b28e956dfaf53d6c20dcf18dca87edf866f11247fa0b480080552312",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l04-p024/canvas-renderer.js",
  "assetSha256": "e71c76a805fb8c9e947610698f37c8689cc7f6f1c191a8ee6f77659acb66753e",
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
  "mainFrameDomain": "sprite-57",
  "mainFrameCount": 609,
  "livePlaybackEndFrame": 609,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-57-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 609
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
