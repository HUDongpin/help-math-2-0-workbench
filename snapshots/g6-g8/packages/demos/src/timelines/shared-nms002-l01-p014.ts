import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L01_P014_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L1/IN/L1IN04.swf",
    "sha256": "f16151e185d22a9c95bf2d7d764110eabcaf760e2f9c0bf09579855a8ddc38d6"
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

export const SHARED_NMS002_L01_P014_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l01-p014",
  "title": "Representing Integers — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "f16151e185d22a9c95bf2d7d764110eabcaf760e2f9c0bf09579855a8ddc38d6",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l01-p014/canvas-renderer.js",
  "assetSha256": "e5fe5a94e07f78ab190de9e246982d666b364630bfc9ba57ee9b47c528867644",
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
  "mainFrameDomain": "sprite-27",
  "mainFrameCount": 197,
  "livePlaybackEndFrame": 197,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-27-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 197
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
