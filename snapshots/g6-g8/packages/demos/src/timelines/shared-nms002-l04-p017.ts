import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L04_P017_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L4/IN/L4IN02.swf",
    "sha256": "871aecfc49c23b59b6a738031963c08dccd7b0128fe88dd76a26c997672bfde4"
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

export const SHARED_NMS002_L04_P017_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l04-p017",
  "title": "Model — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "871aecfc49c23b59b6a738031963c08dccd7b0128fe88dd76a26c997672bfde4",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l04-p017/canvas-renderer.js",
  "assetSha256": "98865168cff10adbd95292377a89943ff79de6502894d517814dd1e0ab1e5b63",
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
  "mainFrameDomain": "sprite-29",
  "mainFrameCount": 434,
  "livePlaybackEndFrame": 434,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-29-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 434
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
