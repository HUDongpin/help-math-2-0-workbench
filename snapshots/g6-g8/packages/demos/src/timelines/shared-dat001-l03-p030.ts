import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L03_P030_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L3/IN/L3IN08.swf",
    "sha256": "5673a39710717ea1c550593e4c30b077be0e496d2f379161e388150eb4cda92f"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "linear-glossary-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-dat001-l03-p030/canvas-renderer.js",
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

export const SHARED_DAT001_L03_P030_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l03-p030",
  "title": "Mode — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "5673a39710717ea1c550593e4c30b077be0e496d2f379161e388150eb4cda92f",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l03-p030/canvas-renderer.js",
  "assetSha256": "881ea8fe3c9d82252b8f130440a57469b412e3f2186f0cb7d808847c683b95ba",
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
  "mainFrameDomain": "sprite-32",
  "mainFrameCount": 383,
  "livePlaybackEndFrame": 383,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-32-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 383
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: glossary-host-bridge-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
