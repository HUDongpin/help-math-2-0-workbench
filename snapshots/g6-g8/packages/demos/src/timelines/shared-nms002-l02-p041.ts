import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L02_P041_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L2/IN/L2IN26.swf",
    "sha256": "61f12c454e3b1a1935b0e5a598578003026fd7c54ea01c779911459cbc587cdd"
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

export const SHARED_NMS002_L02_P041_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l02-p041",
  "title": "Percent of Whole number — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "61f12c454e3b1a1935b0e5a598578003026fd7c54ea01c779911459cbc587cdd",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l02-p041/canvas-renderer.js",
  "assetSha256": "1b32aba25d07dfeb4531076bf2be1a63b48f1b5f93255c96df764dbc288f2f4e",
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
  "mainFrameDomain": "sprite-88",
  "mainFrameCount": 1377,
  "livePlaybackEndFrame": 1377,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-88-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1377
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
