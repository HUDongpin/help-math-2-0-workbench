import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L09_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L9/VB/L9VB02.swf",
    "sha256": "dbc9c458586ed03f957964cd4c5b19432ca810e2af1c7420c5b606fe3f661728"
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

export const SHARED_NMS002_L09_P006_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l09-p006",
  "title": "Order of Operations definition and notation — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "dbc9c458586ed03f957964cd4c5b19432ca810e2af1c7420c5b606fe3f661728",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l09-p006/canvas-renderer.js",
  "assetSha256": "1e517417ba87aadc5db17ebc07651927ff29d1e2cb698a9d43241399114ed099",
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
  "mainFrameDomain": "sprite-62",
  "mainFrameCount": 573,
  "livePlaybackEndFrame": 573,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-62-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 573
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
