import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L09_P007_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L9/VB/L9VB03.swf",
    "sha256": "d6169163debac537c11c3b1ff4b67da23f96a35caac2031a088ce61af848400a"
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

export const SHARED_NMS002_L09_P007_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l09-p007",
  "title": "Order of Operations definition and notation — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "d6169163debac537c11c3b1ff4b67da23f96a35caac2031a088ce61af848400a",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l09-p007/canvas-renderer.js",
  "assetSha256": "185e8d489b4c86cb744941b0595f3d40bcaa240c074d48cbd35611b8721560f2",
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
  "mainFrameDomain": "sprite-46",
  "mainFrameCount": 825,
  "livePlaybackEndFrame": 825,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-46-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 825
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
