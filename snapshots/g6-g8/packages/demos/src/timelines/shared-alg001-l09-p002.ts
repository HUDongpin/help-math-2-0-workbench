import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/RW/L9RW02.swf",
    "sha256": "966d22b481d69a50c112ff4347cc93b0dd318993955afc77f6a5317938f047c6"
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

export const SHARED_ALG001_L09_P002_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p002",
  "title": "Page 1 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "966d22b481d69a50c112ff4347cc93b0dd318993955afc77f6a5317938f047c6",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p002/canvas-renderer.js",
  "assetSha256": "42c7565dc0bb14e1a96c096eab579fd16c2e91906847ae28a191e0906b8dbfaf",
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
  "mainFrameDomain": "sprite-403",
  "mainFrameCount": 1203,
  "livePlaybackEndFrame": 1203,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-403-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1203
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
