import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L07_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L7/RW/L7RW02.swf",
    "sha256": "61db6516526bfc1c3f36e34a571407a0b8556c3c32f021798376ecc192bfa0a7"
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

export const SHARED_GEO001_L07_P002_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l07-p002",
  "title": "Page 1 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "61db6516526bfc1c3f36e34a571407a0b8556c3c32f021798376ecc192bfa0a7",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l07-p002/canvas-renderer.js",
  "assetSha256": "0c680014edf466f66f3794fb28a3393ebfcec194a0fb2b5ba1afb69c288b87f7",
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
  "mainFrameDomain": "sprite-421",
  "mainFrameCount": 1596,
  "livePlaybackEndFrame": 1596,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-421-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1596
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
