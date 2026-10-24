import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L06_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L6/RW/L6RW06.swf",
    "sha256": "00f231ea4d09363a85661e175b211c307af550f5fab595a6db19c5b619447ca4"
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

export const SHARED_ALG001_L06_P006_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l06-p006",
  "title": "Page 5 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "00f231ea4d09363a85661e175b211c307af550f5fab595a6db19c5b619447ca4",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l06-p006/canvas-renderer.js",
  "assetSha256": "617e809db752c271b3931c08150214d6140df6b90e1347e98dbf15237dd50879",
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
  "mainFrameDomain": "sprite-240",
  "mainFrameCount": 834,
  "livePlaybackEndFrame": 834,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-240-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 834
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
