import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L04_P003_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L4/RW/L4RW03.swf",
    "sha256": "ee94f77e5c54167ebfd3d70690a52a19337739c6615b86bcb5ce854bc3677481"
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

export const SHARED_GEO001_L04_P003_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l04-p003",
  "title": "Page 2 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "ee94f77e5c54167ebfd3d70690a52a19337739c6615b86bcb5ce854bc3677481",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l04-p003/canvas-renderer.js",
  "assetSha256": "c9a3f70bb2402b2b519a8f6cab3ab9b76ea5a9355a11e5e33d708971b79a00c5",
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
  "mainFrameDomain": "sprite-119",
  "mainFrameCount": 492,
  "livePlaybackEndFrame": 492,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-119-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 492
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
