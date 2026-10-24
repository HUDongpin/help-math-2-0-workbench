import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L04_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L4/RW/L4RW02.swf",
    "sha256": "bb25d72159debfc37b48b75bf9c7ce7de396665ba76e51bbf5c4ea4175967492"
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

export const SHARED_NMS002_L04_P002_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l04-p002",
  "title": "Page 1 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "bb25d72159debfc37b48b75bf9c7ce7de396665ba76e51bbf5c4ea4175967492",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l04-p002/canvas-renderer.js",
  "assetSha256": "2ccb2dcd8c7f91fa5a5789f387181aa9a8e496d32e28d6711bcd46d380d2403c",
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
  "mainFrameDomain": "sprite-310",
  "mainFrameCount": 946,
  "livePlaybackEndFrame": 946,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-310-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 946
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
