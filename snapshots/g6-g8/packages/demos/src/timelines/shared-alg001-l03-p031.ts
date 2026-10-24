import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P031_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/IN/L3IN17.swf",
    "sha256": "368e0bdd0de4ad56dc087153310af2b2970170daa491f3d57d524488bc72c6d1"
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

export const SHARED_ALG001_L03_P031_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p031",
  "title": "Making a table of values from an equation — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "368e0bdd0de4ad56dc087153310af2b2970170daa491f3d57d524488bc72c6d1",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p031/canvas-renderer.js",
  "assetSha256": "c829f7a86fa21caa4f94d8e162e7c0f348898517f2944dbc91a08dabe8cac99d",
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
  "mainFrameDomain": "sprite-90",
  "mainFrameCount": 1032,
  "livePlaybackEndFrame": 1032,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-90-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1032
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
