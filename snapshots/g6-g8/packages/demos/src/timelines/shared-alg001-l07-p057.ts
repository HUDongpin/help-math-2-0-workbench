import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L07_P057_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L7/TS/L7TS06.swf",
    "sha256": "b8a37cf489eef262a6504028b1a15fa965f5a12749d56cec81a699e80ce9ede3"
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

export const SHARED_ALG001_L07_P057_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l07-p057",
  "title": "4 Step Plan — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "b8a37cf489eef262a6504028b1a15fa965f5a12749d56cec81a699e80ce9ede3",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l07-p057/canvas-renderer.js",
  "assetSha256": "fd2a1a9feb491802fb7709270e58f23d15461da997569d5f576ee9f56ad3f230",
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
