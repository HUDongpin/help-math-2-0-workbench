import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L04_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L4/RW/L4RW04.swf",
    "sha256": "85b03602b3f7318f15ce9d16153897c194d753e354c4e44b34066bbc9ebfe336"
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

export const SHARED_GEO001_L04_P004_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l04-p004",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "85b03602b3f7318f15ce9d16153897c194d753e354c4e44b34066bbc9ebfe336",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l04-p004/canvas-renderer.js",
  "assetSha256": "f4afe04218bc4f158d7585130aa0fe9f2edad7f71dfc6caeff7a9a7ad744b193",
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
  "mainFrameDomain": "sprite-224",
  "mainFrameCount": 1062,
  "livePlaybackEndFrame": 1062,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-224-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1062
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
