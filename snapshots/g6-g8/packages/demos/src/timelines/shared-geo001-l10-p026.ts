import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L10_P026_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L10/IN/L10IN12.swf",
    "sha256": "32936b79038efbe4d01a9dfc85f4face1cd69dd0360b30279ca5c7a3f9e9c98f"
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

export const SHARED_GEO001_L10_P026_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l10-p026",
  "title": "Plotting Geometric Figures — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "32936b79038efbe4d01a9dfc85f4face1cd69dd0360b30279ca5c7a3f9e9c98f",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l10-p026/canvas-renderer.js",
  "assetSha256": "abe58d4e2e36dc6501a54a17455130b821a0420f58f67f6f357806b7bc2fbef0",
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
  "mainFrameDomain": "sprite-52",
  "mainFrameCount": 280,
  "livePlaybackEndFrame": 280,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-52-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 280
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
