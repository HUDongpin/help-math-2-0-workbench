import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L04_P018_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L4/IN/L4IN04.swf",
    "sha256": "4973929cb6728fdf73b55350c544450b6372af21b1afb53d8af95fc007ee8c39"
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

export const SHARED_ALG001_L04_P018_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l04-p018",
  "title": "Describing relations — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "4973929cb6728fdf73b55350c544450b6372af21b1afb53d8af95fc007ee8c39",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l04-p018/canvas-renderer.js",
  "assetSha256": "5dfa18b412181339caca9c4649065a3cf1100c39108f9ec5efccf3660f45c2b6",
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
  "mainFrameDomain": "sprite-74",
  "mainFrameCount": 317,
  "livePlaybackEndFrame": 317,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-74-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 317
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
