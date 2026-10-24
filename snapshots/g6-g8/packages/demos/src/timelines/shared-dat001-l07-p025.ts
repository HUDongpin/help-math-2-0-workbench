import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L07_P025_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L7/IN/L7IN15.swf",
    "sha256": "e77b243fe9ce9018cee1f87931487fb64ac21ec055ad36cdf8dbd5a94594fcb0"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "linear-glossary-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-dat001-l07-p025/canvas-renderer.js",
  "productBlockers": [
    "glossary-host-bridge-not-reconstructed",
    "embedded-audio-lifecycle-not-implemented"
  ],
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "actionScriptExecuted": false,
  "nestedAudioPlaybackCompiled": false,
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_DAT001_L07_P025_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l07-p025",
  "title": "Evaluating Predictions — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "e77b243fe9ce9018cee1f87931487fb64ac21ec055ad36cdf8dbd5a94594fcb0",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l07-p025/canvas-renderer.js",
  "assetSha256": "c0a2affa1613885ddccb4c4c3f95c7842c0198e5da5fa932b5b6f83d46c6f159",
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
  "mainFrameDomain": "sprite-83",
  "mainFrameCount": 562,
  "livePlaybackEndFrame": 562,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-83-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 562
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: glossary-host-bridge-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
