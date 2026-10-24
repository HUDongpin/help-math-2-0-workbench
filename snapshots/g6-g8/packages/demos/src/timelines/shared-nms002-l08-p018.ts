import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L08_P018_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L8/VB/L8VB13.swf",
    "sha256": "ba8c66624714c805ea50d2d035a0f5277b9ff076a8cc07a51070e1e3d38ae1e4"
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

export const SHARED_NMS002_L08_P018_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l08-p018",
  "title": "Scientific Notation — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "ba8c66624714c805ea50d2d035a0f5277b9ff076a8cc07a51070e1e3d38ae1e4",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l08-p018/canvas-renderer.js",
  "assetSha256": "5ba8134cca57e87f32dfa100ce89a9bdb095ec20196ab4157e912c690e3d6137",
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
  "mainFrameDomain": "sprite-57",
  "mainFrameCount": 718,
  "livePlaybackEndFrame": 718,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-57-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 718
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
