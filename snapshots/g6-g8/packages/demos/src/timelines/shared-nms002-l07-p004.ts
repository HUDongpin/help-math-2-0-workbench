import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L07_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L7/RW/L7RW04.swf",
    "sha256": "5a96f06f5196c91dc345008d90b88a5c791a46b0e1ebde05b82571f5e458af7f"
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

export const SHARED_NMS002_L07_P004_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l07-p004",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "5a96f06f5196c91dc345008d90b88a5c791a46b0e1ebde05b82571f5e458af7f",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l07-p004/canvas-renderer.js",
  "assetSha256": "2027ceabb7aa6c3f26ed076abae46770e84d7356eb94f8a77f1a00b53f11f045",
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
  "mainFrameDomain": "sprite-806",
  "mainFrameCount": 1291,
  "livePlaybackEndFrame": 1291,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-806-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1291
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
