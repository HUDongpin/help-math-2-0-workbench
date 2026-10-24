import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L01_P032_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L1/IN/L1IN03.swf",
    "sha256": "c9d7d0109f8b5c4985e90e8752c920ec5e4e60c9a421d833fadf8dbfcb53182a"
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

export const SHARED_GEO001_L01_P032_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l01-p032",
  "title": "Naming Lines and Angles — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "c9d7d0109f8b5c4985e90e8752c920ec5e4e60c9a421d833fadf8dbfcb53182a",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l01-p032/canvas-renderer.js",
  "assetSha256": "c31e6aa0bcc35e8b868dfa4e974e2b961f27638e17d93d6e5e39959718756846",
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
  "mainFrameDomain": "sprite-36",
  "mainFrameCount": 464,
  "livePlaybackEndFrame": 464,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-36-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 464
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
