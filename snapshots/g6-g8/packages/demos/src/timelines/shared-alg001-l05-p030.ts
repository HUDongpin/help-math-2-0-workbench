import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L05_P030_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L5/IN/L5IN05.swf",
    "sha256": "0c554ff28ad322a317fa2e5997f8ebec9fd1677a133c9c5cbbe6f9d5da50b09c"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "linear-glossary-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-alg001-l05-p030/canvas-renderer.js",
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

export const SHARED_ALG001_L05_P030_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l05-p030",
  "title": "Combining Like Terms — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "0c554ff28ad322a317fa2e5997f8ebec9fd1677a133c9c5cbbe6f9d5da50b09c",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l05-p030/canvas-renderer.js",
  "assetSha256": "eea5fbddad5059f5f58b457550e450045c3bf8a5840bffcb359e87174d2beadf",
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
  "mainFrameDomain": "sprite-172",
  "mainFrameCount": 1250,
  "livePlaybackEndFrame": 1250,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-172-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1250
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: glossary-host-bridge-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
