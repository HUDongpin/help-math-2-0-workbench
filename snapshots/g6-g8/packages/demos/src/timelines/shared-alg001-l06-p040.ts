import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P040_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/IN/L6IN12.swf",
    "sha256": "cb4b046089166eef2dd0407a921b91c89d33fe6d99071915325de3439b3b2653"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "pure-linear-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-alg001-l06-p040/canvas-renderer.js",
  "productBlockers": [
    "embedded-audio-lifecycle-not-implemented"
  ],
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "actionScriptExecuted": false,
  "nestedAudioPlaybackCompiled": false,
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L06_P040_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p040",
  "title": "Using the Graph of a Function to Analyze Change — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "cb4b046089166eef2dd0407a921b91c89d33fe6d99071915325de3439b3b2653",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p040/canvas-renderer.js",
  "assetSha256": "a6568ba88450bf9ec258942dc2efa516889caea4b9dd6304a8e38b47f4e90a7b",
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
  "mainFrameDomain": "sprite-86",
  "mainFrameCount": 189,
  "livePlaybackEndFrame": 189,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-86-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 189
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
