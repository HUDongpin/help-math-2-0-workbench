import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L12_P016_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L12/IN/L12IN04.swf",
    "sha256": "58bf7c2120b9b719e45cd1f2f7ce142e9e526df4f054e827646113b5ca3ac8ac"
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

export const SHARED_GEO001_L12_P016_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l12-p016",
  "title": "Pythagorean Theorem — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "58bf7c2120b9b719e45cd1f2f7ce142e9e526df4f054e827646113b5ca3ac8ac",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l12-p016/canvas-renderer.js",
  "assetSha256": "02d86b32a41b2ffd9ed25de29bdb163ecf4424d995fe0004feecae773693c0c3",
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
  "mainFrameDomain": "sprite-31",
  "mainFrameCount": 440,
  "livePlaybackEndFrame": 440,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-31-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 440
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
