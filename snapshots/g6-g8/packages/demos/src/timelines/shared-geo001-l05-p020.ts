import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L05_P020_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L5/IN/L5IN08.swf",
    "sha256": "0983c65bd4e219e3057dde58f622446cc6a1a6393b697770b5388c9706e8d260"
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

export const SHARED_GEO001_L05_P020_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l05-p020",
  "title": "Perimeter — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "0983c65bd4e219e3057dde58f622446cc6a1a6393b697770b5388c9706e8d260",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l05-p020/canvas-renderer.js",
  "assetSha256": "0807f41f18207b6d15682d0408a29dc6698572c07e48cf28abb9767e57ec34b6",
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
  "mainFrameDomain": "sprite-71",
  "mainFrameCount": 642,
  "livePlaybackEndFrame": 642,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-71-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 642
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
