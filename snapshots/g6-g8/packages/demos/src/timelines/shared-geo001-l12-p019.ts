import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L12_P019_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L12/IN/L12IN07.swf",
    "sha256": "30b196592875b33d51c43d8e39677d37470984a3cfdac809238cdbc51f0c06bc"
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

export const SHARED_GEO001_L12_P019_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l12-p019",
  "title": "Using the Pythagorean Theorem to Find Unknown Sides — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "30b196592875b33d51c43d8e39677d37470984a3cfdac809238cdbc51f0c06bc",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l12-p019/canvas-renderer.js",
  "assetSha256": "91b9027783a44ca8f8a0af5cef072972d6724d510fbd737a379fc493a0ca9c2e",
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
  "mainFrameDomain": "sprite-38",
  "mainFrameCount": 277,
  "livePlaybackEndFrame": 277,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-38-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 277
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
