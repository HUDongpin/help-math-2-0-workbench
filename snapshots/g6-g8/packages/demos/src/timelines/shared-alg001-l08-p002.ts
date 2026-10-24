import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L08_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L8/RW/L8RW02.swf",
    "sha256": "4c6b357d02565f8e6ee92f6165d597d87ac49a7ac4ae674896e62d674ebe8e28"
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

export const SHARED_ALG001_L08_P002_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l08-p002",
  "title": "Page 1 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "4c6b357d02565f8e6ee92f6165d597d87ac49a7ac4ae674896e62d674ebe8e28",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l08-p002/canvas-renderer.js",
  "assetSha256": "f7431152dbdb1580389d5b76f32244397d3e0b837b3e76a6d78b943d38abd022",
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
  "mainFrameDomain": "sprite-212",
  "mainFrameCount": 613,
  "livePlaybackEndFrame": 613,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-212-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 613
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
