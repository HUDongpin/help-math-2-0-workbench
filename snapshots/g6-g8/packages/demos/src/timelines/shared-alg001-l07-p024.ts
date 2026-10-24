import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L07_P024_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L7/IN/L7IN05.swf",
    "sha256": "8a4bb273b85b6201c110f8fb6e913c384d6a616117f5109a087464e55d29ef25"
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

export const SHARED_ALG001_L07_P024_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l07-p024",
  "title": "Identifying Slope of a Linear Function (from both graph and equation) — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "8a4bb273b85b6201c110f8fb6e913c384d6a616117f5109a087464e55d29ef25",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l07-p024/canvas-renderer.js",
  "assetSha256": "73c344ed2080f558aafc70bdc96007a6024dccb8c5539e5d2c94cb32e3c77c0f",
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
  "mainFrameDomain": "sprite-62",
  "mainFrameCount": 869,
  "livePlaybackEndFrame": 869,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-62-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 869
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
