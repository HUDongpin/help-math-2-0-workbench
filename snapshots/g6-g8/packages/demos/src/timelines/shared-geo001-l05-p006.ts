import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L05_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L5/RW/L5RW06.swf",
    "sha256": "adfd7bde7987b3c81719cfe9f9778ac16d3ffa913e18d4f706f79af504d9cdb7"
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

export const SHARED_GEO001_L05_P006_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l05-p006",
  "title": "Page 5 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "adfd7bde7987b3c81719cfe9f9778ac16d3ffa913e18d4f706f79af504d9cdb7",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l05-p006/canvas-renderer.js",
  "assetSha256": "983e2dc7fa42ebec19b8c342a9ae8fb6c7007bada7a8382d9a1af418b8125290",
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
  "mainFrameDomain": "sprite-151",
  "mainFrameCount": 339,
  "livePlaybackEndFrame": 339,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-151-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 339
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
