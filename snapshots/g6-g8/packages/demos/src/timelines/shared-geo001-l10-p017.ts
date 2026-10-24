import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L10_P017_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L10/IN/L10IN03.swf",
    "sha256": "2ba36fc041b2227ece93af4c24bd9cdfe4f2c65fa85baa41a91812423126e832"
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

export const SHARED_GEO001_L10_P017_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l10-p017",
  "title": "Parts of a Coordinate Plane — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "2ba36fc041b2227ece93af4c24bd9cdfe4f2c65fa85baa41a91812423126e832",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l10-p017/canvas-renderer.js",
  "assetSha256": "3093e6b339ecccabc6e2a6b201c334c5b84ce2a18e8b5b3f60e8722bc6fb7e6f",
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
  "mainFrameDomain": "sprite-37",
  "mainFrameCount": 221,
  "livePlaybackEndFrame": 221,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-37-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 221
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
