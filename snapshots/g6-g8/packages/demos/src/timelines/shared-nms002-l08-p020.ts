import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L08_P020_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L8/VB/L8VB15.swf",
    "sha256": "b7cc0b57ccc24525a826b47ce39fa8b2b4d4a3b7751cf82ea0565f8a890c85a9"
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

export const SHARED_NMS002_L08_P020_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l08-p020",
  "title": "Scientific Notation — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "b7cc0b57ccc24525a826b47ce39fa8b2b4d4a3b7751cf82ea0565f8a890c85a9",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l08-p020/canvas-renderer.js",
  "assetSha256": "25ffc3b4924cdd0e7d2c8a1b40cc9782d5949458b3d8abafd15b9edb00bd5c0e",
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
  "mainFrameDomain": "sprite-35",
  "mainFrameCount": 479,
  "livePlaybackEndFrame": 479,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-35-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 479
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
