import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L05_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L5/RW/L5RW05.swf",
    "sha256": "f6d8cd8966166010dd7654091d6cc7353f6833d25fa0dff627ecff3649062e80"
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

export const SHARED_GEO001_L05_P005_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l05-p005",
  "title": "Page 4 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "f6d8cd8966166010dd7654091d6cc7353f6833d25fa0dff627ecff3649062e80",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l05-p005/canvas-renderer.js",
  "assetSha256": "ab4bd9de252938a53ca2d52dfd04ba675109f1c4bffe6fafde604706168c9fff",
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
  "mainFrameDomain": "sprite-272",
  "mainFrameCount": 1110,
  "livePlaybackEndFrame": 1110,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-272-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1110
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
