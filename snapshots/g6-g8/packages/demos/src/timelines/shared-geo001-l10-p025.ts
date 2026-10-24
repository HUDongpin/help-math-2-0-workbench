import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L10_P025_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L10/IN/L10IN11.swf",
    "sha256": "3396265dc19810dbc842e86bfbf408cf17578d050c52a01804773e9a52442e8c"
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

export const SHARED_GEO001_L10_P025_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l10-p025",
  "title": "Plotting Geometric Figures — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "3396265dc19810dbc842e86bfbf408cf17578d050c52a01804773e9a52442e8c",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l10-p025/canvas-renderer.js",
  "assetSha256": "1ec9a9c781e1caef27ab4b19124330fcbd89035676e0a500955ba845322dbd90",
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
  "mainFrameDomain": "sprite-56",
  "mainFrameCount": 232,
  "livePlaybackEndFrame": 232,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-56-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 232
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
