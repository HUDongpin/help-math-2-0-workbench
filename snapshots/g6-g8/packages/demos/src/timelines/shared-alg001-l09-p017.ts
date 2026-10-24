import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P017_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN05.swf",
    "sha256": "c8eeb6ed17c453f607b11c8dbecfff2ec547234b0c0e1064fbc66859e7111f5d"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-simple-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-simple-glossary-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P017_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p017",
  "title": "Simplifying Ratios — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "c8eeb6ed17c453f607b11c8dbecfff2ec547234b0c0e1064fbc66859e7111f5d",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p017/canvas-renderer.js",
  "assetSha256": "682c978f2723dc0adc162f64c43b49d3fba702d2f200f3ddf78005a142f9801d",
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
  "mainFrameDomain": "sprite-51",
  "mainFrameCount": 1026,
  "livePlaybackEndFrame": 1026,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-51-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1026
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
