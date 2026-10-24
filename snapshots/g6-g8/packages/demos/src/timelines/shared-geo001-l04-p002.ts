import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L04_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L4/RW/L4RW02.swf",
    "sha256": "a4e34b0428a9f0f9e712f3a30e8bab417fced62a7880d87b1537e28cbb78c6d0"
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

export const SHARED_GEO001_L04_P002_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l04-p002",
  "title": "Page 1 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "a4e34b0428a9f0f9e712f3a30e8bab417fced62a7880d87b1537e28cbb78c6d0",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l04-p002/canvas-renderer.js",
  "assetSha256": "878424c010b68fd5d77a2fe9d82e41e8777cb578d466db85082f663799576b1b",
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
  "mainFrameDomain": "sprite-35",
  "mainFrameCount": 183,
  "livePlaybackEndFrame": 183,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-35-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 183
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
