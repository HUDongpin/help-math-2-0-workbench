import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L03_P031_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L3/IN/L3IN12.swf",
    "sha256": "3f304c08259918ceb6fbea09450033833ef764566625f16a7fd9d3f752248ace"
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

export const SHARED_GEO001_L03_P031_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l03-p031",
  "title": "Triangles in Construction — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "3f304c08259918ceb6fbea09450033833ef764566625f16a7fd9d3f752248ace",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l03-p031/canvas-renderer.js",
  "assetSha256": "ba0d514d48650f3c3b21a3105a5ac7895e604511479af818ce811f7164148896",
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
  "mainFrameDomain": "sprite-291",
  "mainFrameCount": 1111,
  "livePlaybackEndFrame": 1111,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-291-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1111
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
