import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L07_P028_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L7/IN/L7IN09.swf",
    "sha256": "43bf3405c4d0789ff33e8c6277adf26c09a161162e009682f966a7209c8bbda9"
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

export const SHARED_ALG001_L07_P028_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l07-p028",
  "title": "Graphing a Line by Calculating Two Points on the Line Using Its Equation — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "43bf3405c4d0789ff33e8c6277adf26c09a161162e009682f966a7209c8bbda9",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l07-p028/canvas-renderer.js",
  "assetSha256": "9eb19a8f9b73cf1c03b9ec0fb6529f226afe294cfa498f351a3e094152429230",
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
  "mainFrameDomain": "sprite-50",
  "mainFrameCount": 837,
  "livePlaybackEndFrame": 837,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-50-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 837
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
