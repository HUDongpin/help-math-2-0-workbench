import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P017_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/IN/L12IN03.swf",
    "sha256": "6ea03b7b7bb6ef0d2aeec9187b835093691ebe07d4196c13bcaac6b3e30161aa"
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

export const SHARED_ALG001_L12_P017_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p017",
  "title": "Parts of a Coordinate Plane — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "6ea03b7b7bb6ef0d2aeec9187b835093691ebe07d4196c13bcaac6b3e30161aa",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p017/canvas-renderer.js",
  "assetSha256": "cafd0634007f303b03d159bdf5bf7f371afc15f6420b76f1c33ba34eff627ce1",
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
  "mainFrameDomain": "sprite-34",
  "mainFrameCount": 167,
  "livePlaybackEndFrame": 167,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-34-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 167
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
