import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L05_P025_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L5/IN/L5IN13.swf",
    "sha256": "099684682550b914901d055351ac83c7a59b880ccecace92d1c1ab7daf630e53"
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

export const SHARED_GEO001_L05_P025_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l05-p025",
  "title": "Area of Trapezoids — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "099684682550b914901d055351ac83c7a59b880ccecace92d1c1ab7daf630e53",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l05-p025/canvas-renderer.js",
  "assetSha256": "5c0c9c25878da0d8f4b5707d926fe7df51a761d46aeb0e473f194948371f068e",
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
  "mainFrameDomain": "sprite-33",
  "mainFrameCount": 754,
  "livePlaybackEndFrame": 754,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-33-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 754
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
