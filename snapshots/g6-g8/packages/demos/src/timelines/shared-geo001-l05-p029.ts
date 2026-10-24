import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L05_P029_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L5/IN/L5IN17.swf",
    "sha256": "0fc3f23f894b2380ff726669fc82790b2ffc11852c62feb1a29ff2d79666c0d8"
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

export const SHARED_GEO001_L05_P029_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l05-p029",
  "title": "Area — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "0fc3f23f894b2380ff726669fc82790b2ffc11852c62feb1a29ff2d79666c0d8",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l05-p029/canvas-renderer.js",
  "assetSha256": "0c6ea6dc92d93731596aed7e44cac27076b15da2fe376b49933112a9bd3f1f8b",
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
  "mainFrameDomain": "sprite-136",
  "mainFrameCount": 412,
  "livePlaybackEndFrame": 412,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-136-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 412
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
