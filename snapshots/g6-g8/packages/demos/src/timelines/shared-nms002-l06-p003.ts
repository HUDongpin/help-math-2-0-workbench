import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L06_P003_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L6/RW/L6RW03.swf",
    "sha256": "4f54c4113577fa2942901a3eaee25ded0ef8c8052ed3b7005e23ca6ac8760404"
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

export const SHARED_NMS002_L06_P003_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l06-p003",
  "title": "Page 2 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "4f54c4113577fa2942901a3eaee25ded0ef8c8052ed3b7005e23ca6ac8760404",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l06-p003/canvas-renderer.js",
  "assetSha256": "1d409e52285f33c3b1f7536fd742b7a4c28861e2476e0733a99753251ed7c235",
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
  "mainFrameDomain": "sprite-242",
  "mainFrameCount": 933,
  "livePlaybackEndFrame": 933,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-242-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 933
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
