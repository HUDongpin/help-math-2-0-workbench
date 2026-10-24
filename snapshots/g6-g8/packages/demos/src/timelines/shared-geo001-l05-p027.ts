import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L05_P027_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L5/IN/L5IN15.swf",
    "sha256": "661f8296375e2ed5ccce6f500e8af30a1b5443bee0ab3603a57fd2cbc31b968b"
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

export const SHARED_GEO001_L05_P027_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l05-p027",
  "title": "Area of Triangles — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "661f8296375e2ed5ccce6f500e8af30a1b5443bee0ab3603a57fd2cbc31b968b",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l05-p027/canvas-renderer.js",
  "assetSha256": "e35a2a0e77096651a8ea29ef08cab09ea776f8bc3fffaa29a7ae5c7c688b2b2d",
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
  "mainFrameDomain": "sprite-47",
  "mainFrameCount": 1153,
  "livePlaybackEndFrame": 1153,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-47-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1153
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
