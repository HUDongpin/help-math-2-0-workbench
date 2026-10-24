import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L12_P021_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L12/IN/L12IN04.swf",
    "sha256": "6b314b297317b53486db4556a8ecb8d52209e60a19fc29e2de9d19e3044c21bf"
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

export const SHARED_NMS002_L12_P021_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l12-p021",
  "title": "Understanding Number Sets — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "6b314b297317b53486db4556a8ecb8d52209e60a19fc29e2de9d19e3044c21bf",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l12-p021/canvas-renderer.js",
  "assetSha256": "99110590619a60308c662b95a7fd5a901a19a4dedae90284a84b067429488cff",
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
  "mainFrameDomain": "sprite-100",
  "mainFrameCount": 846,
  "livePlaybackEndFrame": 846,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-100-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 846
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
