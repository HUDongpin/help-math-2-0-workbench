import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L10_P044_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L10/TS/L10TS06.swf",
    "sha256": "62ace2e4bf9f3912b0a0287de7ff4a9f6e76734ec736e3bb7c278e102fe684e0"
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

export const SHARED_NMS002_L10_P044_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l10-p044",
  "title": "4 Step Plan — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "62ace2e4bf9f3912b0a0287de7ff4a9f6e76734ec736e3bb7c278e102fe684e0",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l10-p044/canvas-renderer.js",
  "assetSha256": "a51702125615e60c93d6f41a1394e5a2f154417fa87f837ef5d42e0b6d4cebc4",
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
  "mainFrameDomain": "sprite-21",
  "mainFrameCount": 124,
  "livePlaybackEndFrame": 124,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-21-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 124
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
