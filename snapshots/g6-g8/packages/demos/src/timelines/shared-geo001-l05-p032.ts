import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L05_P032_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L5/IN/L5IN20.swf",
    "sha256": "b157fa617c071335fdc082811d928f1f9141f939d7292bead5b5623feff4923c"
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

export const SHARED_GEO001_L05_P032_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l05-p032",
  "title": "Equal Areas, Different Shapes — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "b157fa617c071335fdc082811d928f1f9141f939d7292bead5b5623feff4923c",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l05-p032/canvas-renderer.js",
  "assetSha256": "340bf858dc8ba0d34bc7ad795f5519cd56fa035dbb3b64a2673f75a38679f5d5",
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
  "mainFrameDomain": "sprite-117",
  "mainFrameCount": 1123,
  "livePlaybackEndFrame": 1123,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-117-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1123
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
