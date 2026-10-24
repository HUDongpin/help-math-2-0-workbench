import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L05_P026_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L5/VB/L5VB23.swf",
    "sha256": "51163550d15dd6e0f2731c79e28f22a9868cf67d0de2ea4c003036daad3e08d1"
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

export const SHARED_ALG001_L05_P026_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l05-p026",
  "title": "Monomial, Binomial, Trinomial, and Polynomial — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "51163550d15dd6e0f2731c79e28f22a9868cf67d0de2ea4c003036daad3e08d1",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l05-p026/canvas-renderer.js",
  "assetSha256": "fd751bcdfaa4af43412af73a024997f1ca583a4e6a2f19647c35cf5946775dd8",
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
  "mainFrameDomain": "sprite-66",
  "mainFrameCount": 1555,
  "livePlaybackEndFrame": 1555,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-66-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1555
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
