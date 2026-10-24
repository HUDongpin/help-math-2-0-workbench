import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L01_P031_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L1/IN/L1IN02.swf",
    "sha256": "0902cfc43070268183d25ee09f34556bc8785904b9a580303af1ca70db40019c"
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

export const SHARED_GEO001_L01_P031_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l01-p031",
  "title": "Naming Lines and Angles — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "0902cfc43070268183d25ee09f34556bc8785904b9a580303af1ca70db40019c",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l01-p031/canvas-renderer.js",
  "assetSha256": "4702311d9aa6032645b0a313acdfd0c8dde5233bee5ef0db6f7427f1dd3dbb55",
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
  "mainFrameDomain": "sprite-127",
  "mainFrameCount": 952,
  "livePlaybackEndFrame": 952,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-127-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 952
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
