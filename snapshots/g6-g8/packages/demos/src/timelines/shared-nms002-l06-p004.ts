import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L06_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L6/RW/L6RW04.swf",
    "sha256": "5e938f5732fd691bd9f7c0b29b90749591af3c8c717bdfa335dbcbaa62660c2a"
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

export const SHARED_NMS002_L06_P004_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l06-p004",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "5e938f5732fd691bd9f7c0b29b90749591af3c8c717bdfa335dbcbaa62660c2a",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l06-p004/canvas-renderer.js",
  "assetSha256": "d65d99ad9312007fe1a433fa0dbd395bfe8f5bf0e21406846c2117413cfc0c17",
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
  "mainFrameDomain": "sprite-208",
  "mainFrameCount": 867,
  "livePlaybackEndFrame": 867,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-208-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 867
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
