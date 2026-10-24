import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L01_P008_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L1/RW/L1RW08.swf",
    "sha256": "0a47fd053bd8f8a9101274e6ccd11d387be8f01adb58b9e53ccd220c552d2b43"
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

export const SHARED_GEO001_L01_P008_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l01-p008",
  "title": "Page 7 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "0a47fd053bd8f8a9101274e6ccd11d387be8f01adb58b9e53ccd220c552d2b43",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l01-p008/canvas-renderer.js",
  "assetSha256": "7a8dbff96a2bdd728b0d4af668eb9a3ef5403afd728121c0cf3eca0c9691156e",
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
  "mainFrameDomain": "sprite-68",
  "mainFrameCount": 143,
  "livePlaybackEndFrame": 143,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-68-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 143
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
