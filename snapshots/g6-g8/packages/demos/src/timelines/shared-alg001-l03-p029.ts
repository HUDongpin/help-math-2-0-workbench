import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P029_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/IN/L3IN15.swf",
    "sha256": "71faaf09f7a177a5ac93470fe2b44db4c0f4cd1a66d93999ecd0f5ed36d05bf3"
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

export const SHARED_ALG001_L03_P029_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p029",
  "title": "Solving equations using pictorial models and using symbols to record the actions — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "71faaf09f7a177a5ac93470fe2b44db4c0f4cd1a66d93999ecd0f5ed36d05bf3",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p029/canvas-renderer.js",
  "assetSha256": "7a8cb52258721dd37e0ae8f391b02160b10f50fc4d6f477322a7fefbed2ae0e9",
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
  "mainFrameDomain": "sprite-48",
  "mainFrameCount": 1020,
  "livePlaybackEndFrame": 1020,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-48-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1020
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
