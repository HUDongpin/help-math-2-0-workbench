import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L12_P022_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L12/IN/L12IN05.swf",
    "sha256": "7d2e6cc9fb9baa4e0c0c3a998503ab3070ce51b92bb3d714af870349b1dce36c"
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

export const SHARED_NMS002_L12_P022_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l12-p022",
  "title": "Number Set Relationships — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "7d2e6cc9fb9baa4e0c0c3a998503ab3070ce51b92bb3d714af870349b1dce36c",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l12-p022/canvas-renderer.js",
  "assetSha256": "d845634fa712fb2aa94b7f4bd5cb39df60a6bf17ee88640e8b201926353d18f8",
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
  "mainFrameDomain": "sprite-77",
  "mainFrameCount": 879,
  "livePlaybackEndFrame": 879,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-77-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 879
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
