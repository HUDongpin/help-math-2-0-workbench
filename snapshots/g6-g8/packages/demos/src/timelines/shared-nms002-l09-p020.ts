import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L09_P020_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L9/IN/L9IN05.swf",
    "sha256": "0e433675c7241880efd4c95b98916be6e9cc1353ca96e986addd79785f4be615"
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

export const SHARED_NMS002_L09_P020_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l09-p020",
  "title": "Evaluating Expressions — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "0e433675c7241880efd4c95b98916be6e9cc1353ca96e986addd79785f4be615",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l09-p020/canvas-renderer.js",
  "assetSha256": "0bc2fce848c4994f97af3c6ee5ac154ebfdba3ab53eeb8bbd31de2f23f2bd45a",
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
  "mainFrameDomain": "sprite-58",
  "mainFrameCount": 777,
  "livePlaybackEndFrame": 777,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-58-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 777
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
