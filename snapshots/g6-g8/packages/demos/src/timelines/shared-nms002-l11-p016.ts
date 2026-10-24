import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L11_P016_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L11/IN/L11IN06.swf",
    "sha256": "c183e28b91b74bff6ce4bebf68ae6b04f2abcee3d5dcfbc7f53024bfb3a95887"
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

export const SHARED_NMS002_L11_P016_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l11-p016",
  "title": "Writing Equivalent Rational Numbers: Fractions as Decimals — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "c183e28b91b74bff6ce4bebf68ae6b04f2abcee3d5dcfbc7f53024bfb3a95887",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l11-p016/canvas-renderer.js",
  "assetSha256": "292255633b8243986734ce3cc5f5f6997c2123559a239ab47e4dae21aaeeb9e0",
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
  "mainFrameDomain": "sprite-32",
  "mainFrameCount": 500,
  "livePlaybackEndFrame": 500,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-32-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 500
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
