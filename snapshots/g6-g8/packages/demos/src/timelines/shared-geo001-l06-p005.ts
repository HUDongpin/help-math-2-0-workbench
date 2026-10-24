import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L06_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L6/RW/L6RW05.swf",
    "sha256": "38e028dc5985a41b6e1359facff8b1dec6e0017dda4829b3dac2e3f6c963e21e"
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

export const SHARED_GEO001_L06_P005_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l06-p005",
  "title": "Page 4 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "38e028dc5985a41b6e1359facff8b1dec6e0017dda4829b3dac2e3f6c963e21e",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l06-p005/canvas-renderer.js",
  "assetSha256": "021ba2fa90db6d8ba81ef7169de7ee6f8c32adaf5fb33d5932270e08e8276b5a",
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
  "mainFrameDomain": "sprite-138",
  "mainFrameCount": 1216,
  "livePlaybackEndFrame": 1216,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-138-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1216
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
