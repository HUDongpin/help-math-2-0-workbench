import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P032_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/IN/L12IN18.swf",
    "sha256": "303b502eefcea8430d208270739834f1b208009b03ffd454fa8c804a9486695e"
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

export const SHARED_ALG001_L12_P032_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p032",
  "title": "Graphing Inequalities — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "303b502eefcea8430d208270739834f1b208009b03ffd454fa8c804a9486695e",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p032/canvas-renderer.js",
  "assetSha256": "0c06317411b6971a67e0310728a3eef1412b4b3fac1a5fb773d9aa852f89a524",
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
  "mainFrameDomain": "sprite-38",
  "mainFrameCount": 196,
  "livePlaybackEndFrame": 196,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-38-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 196
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
