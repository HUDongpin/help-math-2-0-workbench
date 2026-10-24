import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P039_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/IN/L6IN11.swf",
    "sha256": "d847e045639feed835c03559272ff1a0f9e29d5a34cc96efc71ce2417aa2735d"
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

export const SHARED_ALG001_L06_P039_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p039",
  "title": "Using Functions to Model Unit Conversion — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "d847e045639feed835c03559272ff1a0f9e29d5a34cc96efc71ce2417aa2735d",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p039/canvas-renderer.js",
  "assetSha256": "d76ab7e269b3fbfdb312ff035abad1affcf46049abc6a0d9d5c129545d86ef52",
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
  "mainFrameDomain": "sprite-338",
  "mainFrameCount": 2294,
  "livePlaybackEndFrame": 2294,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-338-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 2294
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
