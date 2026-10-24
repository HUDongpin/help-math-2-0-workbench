import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L11_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L11/RW/L11RW02.swf",
    "sha256": "28cf59e37938fbcdc856e53b165b0b1ee0969392e9acc7be42e763d0d885ed1c"
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

export const SHARED_GEO001_L11_P002_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l11-p002",
  "title": "Page 1 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "28cf59e37938fbcdc856e53b165b0b1ee0969392e9acc7be42e763d0d885ed1c",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l11-p002/canvas-renderer.js",
  "assetSha256": "51f7fbb7e3b1ab53e09909df35e43725838d3fdbc7caf63e5376f0804b54c9ef",
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
  "mainFrameDomain": "sprite-47",
  "mainFrameCount": 226,
  "livePlaybackEndFrame": 226,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-47-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 226
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
