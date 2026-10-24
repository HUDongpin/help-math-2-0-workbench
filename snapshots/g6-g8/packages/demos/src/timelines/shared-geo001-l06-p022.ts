import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L06_P022_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L6/IN/L6IN02.swf",
    "sha256": "d80d880fec0b96367bb19f0a7f9a36c646ce4eda5fc0a8e2a1f3430eaa3d3981"
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

export const SHARED_GEO001_L06_P022_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l06-p022",
  "title": "Parts of a Circle — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "d80d880fec0b96367bb19f0a7f9a36c646ce4eda5fc0a8e2a1f3430eaa3d3981",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l06-p022/canvas-renderer.js",
  "assetSha256": "0b64b9fa29c384853f7028701ffed0a550222af86ec709ae9d2e25b313df5a55",
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
  "mainFrameDomain": "sprite-109",
  "mainFrameCount": 671,
  "livePlaybackEndFrame": 671,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-109-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 671
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
