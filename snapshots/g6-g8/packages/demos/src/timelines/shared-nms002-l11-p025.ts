import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L11_P025_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L11/IN/L11IN15.swf",
    "sha256": "10b6b7c5b3e574bb2508f94b369a15971fdcf6b5a4dc2badd3fe201281beb8e1"
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

export const SHARED_NMS002_L11_P025_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l11-p025",
  "title": "Repeating Decimals — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "10b6b7c5b3e574bb2508f94b369a15971fdcf6b5a4dc2badd3fe201281beb8e1",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l11-p025/canvas-renderer.js",
  "assetSha256": "98d2813e97497aa15ea11b6082d1bbffd5d2de981ea4019f6a881c4beb10a68d",
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
  "mainFrameDomain": "sprite-17",
  "mainFrameCount": 541,
  "livePlaybackEndFrame": 541,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-17-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 541
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
