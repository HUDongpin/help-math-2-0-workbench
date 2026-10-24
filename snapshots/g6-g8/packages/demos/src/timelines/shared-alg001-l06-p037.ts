import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P037_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/IN/L6IN09.swf",
    "sha256": "21bc538d7e4ec5e63c00b5925d81c31c968612082b770479cb3a06872a221e00"
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

export const SHARED_ALG001_L06_P037_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p037",
  "title": "Making a Table of Function Values from the Graph of a Function — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "21bc538d7e4ec5e63c00b5925d81c31c968612082b770479cb3a06872a221e00",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p037/canvas-renderer.js",
  "assetSha256": "10e418283924b0eff0e3689e1d4598f7a3dd07c5a61e3691872e0a977cdba1f6",
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
  "rootFrameCount": 13,
  "rootBeginFrame": 6,
  "mainFrameDomain": "sprite-60",
  "mainFrameCount": 522,
  "livePlaybackEndFrame": 522,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-60-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 522
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
