import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L06_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L6/RW/L6RW04.swf",
    "sha256": "1457c05c50006164eba28d85be33b7fd6fb8caf8818f60cef2dee1b2441e145d"
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

export const SHARED_GEO001_L06_P004_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l06-p004",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "1457c05c50006164eba28d85be33b7fd6fb8caf8818f60cef2dee1b2441e145d",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l06-p004/canvas-renderer.js",
  "assetSha256": "ac134792bdbf90137eb691da88905e33d0ea58f358d4d4d735faada017732e1f",
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
  "mainFrameDomain": "sprite-430",
  "mainFrameCount": 2198,
  "livePlaybackEndFrame": 2198,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-430-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 2198
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
