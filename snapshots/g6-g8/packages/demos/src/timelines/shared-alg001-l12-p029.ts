import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P029_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L12/IN/L12IN15.swf",
    "sha256": "4e68aed432b54d367114ced5d355c9f6c9f44f266c9c05f90990dc226234e878"
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

export const SHARED_ALG001_L12_P029_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l12-p029",
  "title": "Graphing Equations of the form y = nx squared — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "4e68aed432b54d367114ced5d355c9f6c9f44f266c9c05f90990dc226234e878",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l12-p029/canvas-renderer.js",
  "assetSha256": "32e2ad12d300a791fff26bc7d4f0dbace8a9c1558f5dcd5cb317585671223b68",
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
  "mainFrameDomain": "sprite-93",
  "mainFrameCount": 290,
  "livePlaybackEndFrame": 290,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-93-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 290
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
