import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L05_P014_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L5/VB/L5VB11.swf",
    "sha256": "b98917e5f4b433084a9f1a18f07fa861162785d167db5c72a20f8337990a1414"
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

export const SHARED_ALG001_L05_P014_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l05-p014",
  "title": "Commutative Property and Associative Property Review — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "b98917e5f4b433084a9f1a18f07fa861162785d167db5c72a20f8337990a1414",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l05-p014/canvas-renderer.js",
  "assetSha256": "95efc9b83b83f0eac4aec4fffb8a7c651da66ee6c670466d0709370b4d485726",
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
  "mainFrameDomain": "sprite-91",
  "mainFrameCount": 533,
  "livePlaybackEndFrame": 533,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-91-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 533
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
