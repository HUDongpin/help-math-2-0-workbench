import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L06_P027_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L6/IN/L6IN07.swf",
    "sha256": "212f8ffb2238d701ebf69bfdad9b9ededcda9f966a33fd6dc1b23d5030a80d66"
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

export const SHARED_GEO001_L06_P027_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l06-p027",
  "title": "What is Pi? — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "212f8ffb2238d701ebf69bfdad9b9ededcda9f966a33fd6dc1b23d5030a80d66",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l06-p027/canvas-renderer.js",
  "assetSha256": "5fb181c9849bb5a14bd364317fd70b07dd20a3e888dd8bdb58a3e752bb4c9cd7",
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
  "mainFrameDomain": "sprite-61",
  "mainFrameCount": 684,
  "livePlaybackEndFrame": 684,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-61-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 684
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
