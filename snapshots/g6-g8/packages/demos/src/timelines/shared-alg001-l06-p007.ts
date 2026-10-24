import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P007_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/RW/L6RW06A.swf",
    "sha256": "f6991a7b6ae16439030b33a74e1ea42385b431df5c39a0b0752a9d5c701b592a"
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

export const SHARED_ALG001_L06_P007_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p007",
  "title": "Page 6 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "f6991a7b6ae16439030b33a74e1ea42385b431df5c39a0b0752a9d5c701b592a",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p007/canvas-renderer.js",
  "assetSha256": "59e97998c27ed2263d536dfc5bef555a13ca79e4e473aa695b6988b92c4a116a",
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
  "mainFrameDomain": "sprite-542",
  "mainFrameCount": 578,
  "livePlaybackEndFrame": 578,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-542-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 578
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
