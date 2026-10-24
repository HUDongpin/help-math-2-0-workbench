import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P036_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/IN/L6IN08.swf",
    "sha256": "3ff7aa1bbacf3414b2b02836f4797866d0e92b29635507f54ccd8d9f5a0fb4d1"
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

export const SHARED_ALG001_L06_P036_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p036",
  "title": "Drawing the Graph of a Function from a Table of Function Values — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "3ff7aa1bbacf3414b2b02836f4797866d0e92b29635507f54ccd8d9f5a0fb4d1",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p036/canvas-renderer.js",
  "assetSha256": "58d950df0baf6fc61d46092e2f20fa367b6c1140f5651056fac7af1ce9acc99e",
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
  "rootFrameCount": 13,
  "rootBeginFrame": 6,
  "mainFrameDomain": "sprite-60",
  "mainFrameCount": 333,
  "livePlaybackEndFrame": 333,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-60-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 333
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
