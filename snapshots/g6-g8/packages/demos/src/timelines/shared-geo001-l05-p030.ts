import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L05_P030_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L5/IN/L5IN18.swf",
    "sha256": "f7dd08233827f0eb79456c51c6f659d67c77c4c48b827f695589d7dbf2e419a6"
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

export const SHARED_GEO001_L05_P030_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l05-p030",
  "title": "Finding Missing Lengths — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "f7dd08233827f0eb79456c51c6f659d67c77c4c48b827f695589d7dbf2e419a6",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l05-p030/canvas-renderer.js",
  "assetSha256": "6a2bb6f066077464f021887034c4606716858619b962b19fd18e17a278f3ce6a",
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
  "mainFrameDomain": "sprite-50",
  "mainFrameCount": 586,
  "livePlaybackEndFrame": 586,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-50-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 586
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
