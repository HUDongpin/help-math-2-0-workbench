import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L07_P029_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L7/IN/L7IN10.swf",
    "sha256": "c9ace3d71f04578a6a8c15bd27856b141144c3ac5b9e1c56efc23750da64c603"
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

export const SHARED_ALG001_L07_P029_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l07-p029",
  "title": "Graphing a Line Using Slope and y-Intercept — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "c9ace3d71f04578a6a8c15bd27856b141144c3ac5b9e1c56efc23750da64c603",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l07-p029/canvas-renderer.js",
  "assetSha256": "66a92da2c581c644795efe7743c41da7ff63c905af42c3f2052c6b8d70c575c3",
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
  "mainFrameDomain": "sprite-42",
  "mainFrameCount": 688,
  "livePlaybackEndFrame": 688,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-42-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 688
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
