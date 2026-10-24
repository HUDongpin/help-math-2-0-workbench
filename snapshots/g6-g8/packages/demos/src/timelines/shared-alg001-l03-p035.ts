import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P035_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/IN/L3IN21.swf",
    "sha256": "9259a1cb343ddb5ad7c01a30f8c71e6e2c2bce544882bd3d3142d6699ea55aff"
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

export const SHARED_ALG001_L03_P035_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p035",
  "title": "Writing equations from tables of values — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "9259a1cb343ddb5ad7c01a30f8c71e6e2c2bce544882bd3d3142d6699ea55aff",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p035/canvas-renderer.js",
  "assetSha256": "fca39e2716b3045d96f0b17ee5183cfadd5b107fb87f24f818b497673da9b598",
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
  "mainFrameDomain": "sprite-29",
  "mainFrameCount": 976,
  "livePlaybackEndFrame": 976,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-29-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 976
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
