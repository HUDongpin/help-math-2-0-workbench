import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L03_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L3/RW/L3RW04.swf",
    "sha256": "d85cbb6a74d072c8a5b1230cbe005c6d1e7e553d2d3285ea8b731562f270cc0c"
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

export const SHARED_GEO001_L03_P004_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l03-p004",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "d85cbb6a74d072c8a5b1230cbe005c6d1e7e553d2d3285ea8b731562f270cc0c",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l03-p004/canvas-renderer.js",
  "assetSha256": "f53c57eef3f5b5ef9ef645e493e01dd368e971943fe112ded340931ec4dbaf9a",
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
  "mainFrameDomain": "sprite-96",
  "mainFrameCount": 779,
  "livePlaybackEndFrame": 779,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-96-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 779
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
