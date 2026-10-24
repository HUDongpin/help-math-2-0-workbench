import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L06_P045_SOURCE = Object.freeze({
  "calibrationId": "g678-fq01-current-js-scaleout-43-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L6/FQ/L6FQ01.swf",
    "sha256": "a4ba90ada3600559ed380f3e60f8d5cc22001d66f12bf26cb45f0551e5c84241"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "final-quiz-intro-source-static",
  "familyVisualPlaybackCalibrationPassed": true,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_DAT001_L06_P045_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l06-p045",
  "title": "Introduction — local-only FQ01 Current-JS candidate",
  "sourceSwfSha256": "a4ba90ada3600559ed380f3e60f8d5cc22001d66f12bf26cb45f0551e5c84241",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l06-p045/canvas-renderer.js",
  "assetSha256": "9720aa353abd59c097683bb4b11b583337ccb1c14dcc436511558e0aa44d8d95",
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
  "mainFrameDomain": "sprite-75",
  "mainFrameCount": 52,
  "livePlaybackEndFrame": 52,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-75-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 52
    }
  ],
  "sourceControlBehaviorLabel": "FQ01 visual playback family calibrated; acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
