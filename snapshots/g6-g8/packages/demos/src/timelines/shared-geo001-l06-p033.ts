import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L06_P033_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L6/IN/L6IN13.swf",
    "sha256": "67dd8fb51d7722ccffe9c75083f751bcc153c6311f93de24a4c4fac66e60d3af"
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

export const SHARED_GEO001_L06_P033_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l06-p033",
  "title": "Area — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "67dd8fb51d7722ccffe9c75083f751bcc153c6311f93de24a4c4fac66e60d3af",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l06-p033/canvas-renderer.js",
  "assetSha256": "c4b1239484f7f0a83e7b2620c6cd83c8489cd8f1ee7b51616dffd97c5c95e0ac",
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
  "mainFrameDomain": "sprite-295",
  "mainFrameCount": 2201,
  "livePlaybackEndFrame": 2201,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-295-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 2201
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
