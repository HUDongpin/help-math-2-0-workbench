import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L08_P002_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L8/RW/L8RW02.swf",
    "sha256": "9cd9f282c9b6ba6824fcb20d39c52fee66f1c3b6b05878542fa70f88a882c3cb"
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

export const SHARED_DAT001_L08_P002_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l08-p002",
  "title": "Page 1 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "9cd9f282c9b6ba6824fcb20d39c52fee66f1c3b6b05878542fa70f88a882c3cb",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l08-p002/canvas-renderer.js",
  "assetSha256": "eb1b880bbde930e834c2446ddb7be0de1baa519d6bd11527239dacc458584e2f",
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
  "mainFrameDomain": "sprite-392",
  "mainFrameCount": 1355,
  "livePlaybackEndFrame": 1355,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-392-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1355
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
