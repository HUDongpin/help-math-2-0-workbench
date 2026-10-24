import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P026_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/IN/L12IN12.swf",
    "sha256": "fb581c49aa4d6892ad182799ae28d7aabe545cdbb496a80fcbcc48eb75be7258"
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

export const SHARED_ALG001_L12_P026_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p026",
  "title": "Graphing a Line by Plotting Points — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "fb581c49aa4d6892ad182799ae28d7aabe545cdbb496a80fcbcc48eb75be7258",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p026/canvas-renderer.js",
  "assetSha256": "edb8783a1b7d58c50b2db06511f160cedba2d2fd828e8ba417af8789071fc87a",
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
  "mainFrameDomain": "sprite-60",
  "mainFrameCount": 802,
  "livePlaybackEndFrame": 802,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-60-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 802
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
