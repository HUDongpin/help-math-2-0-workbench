import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L01_P043_SOURCE = Object.freeze({
  "calibrationId": "g678-ts07-nms-l1-current-js-1-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L1/TS/L1TS07.swf",
    "sha256": "c920dfa231eb8d4e1824454df041899f8c1c979b94c0553ef44c527ac81c21df"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "ts07-nms-l1-assessment-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "ts07-nms-l1-browser-product-calibration-pending",
    "ts07-feedback-audio-acceptance-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_NMS002_L01_P043_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l01-p043",
  "title": "Question 1 — local-only TS07 Current-JS candidate",
  "sourceSwfSha256": "c920dfa231eb8d4e1824454df041899f8c1c979b94c0553ef44c527ac81c21df",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l01-p043/canvas-renderer.js",
  "assetSha256": "19cd91af13b13a5fa823c687e9c3f3ed744344a1a85315bdd58cb38d5c7cebd0",
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
  "mainFrameDomain": "sprite-331",
  "mainFrameCount": 779,
  "livePlaybackEndFrame": 779,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-331-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 779
    }
  ],
  "sourceControlBehaviorLabel": "TS07 typed assessment candidate awaiting browser product calibration; feedback audio and downstream acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
