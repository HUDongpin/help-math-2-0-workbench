import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L04_P020_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L4/IN/L4IN10.swf",
    "sha256": "11fca0cbd012475dce14be1c0d5b92967eaf52c643f783dfba509c3027541d31"
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

export const SHARED_DAT001_L04_P020_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l04-p020",
  "title": "Evaluating Representations — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "11fca0cbd012475dce14be1c0d5b92967eaf52c643f783dfba509c3027541d31",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l04-p020/canvas-renderer.js",
  "assetSha256": "695ddaa383c67feed10d2c4d6ba5f3561afc04d07f3cf08c2c86ec3239dfa952",
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
  "mainFrameDomain": "sprite-49",
  "mainFrameCount": 316,
  "livePlaybackEndFrame": 316,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-49-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 316
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
