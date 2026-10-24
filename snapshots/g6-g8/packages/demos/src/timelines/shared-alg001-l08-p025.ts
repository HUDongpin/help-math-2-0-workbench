import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L08_P025_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L8/IN/L8IN10.swf",
    "sha256": "83c9715714e8fc318ad066b8b731f2799c9a1d497a618c9b4fddb929947927df"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "linear-glossary-source-static",
  "runtimePath": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-alg001-l08-p025/canvas-renderer.js",
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

export const SHARED_ALG001_L08_P025_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l08-p025",
  "title": "Identifying y-Intercepts from Equation written in slope-intercept form — local-only source-static Current-JS engineering candidate",
  "sourceSwfSha256": "83c9715714e8fc318ad066b8b731f2799c9a1d497a618c9b4fddb929947927df",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l08-p025/canvas-renderer.js",
  "assetSha256": "714630d04ff696717a110eaf80e1a23b643c83268dc03bbeb3f7907f56f4aee9",
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
  "mainFrameDomain": "sprite-41",
  "mainFrameCount": 425,
  "livePlaybackEndFrame": 425,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-41-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 425
    }
  ],
  "sourceControlBehaviorLabel": "Blocked product behaviors: glossary-host-bridge-not-reconstructed, embedded-audio-lifecycle-not-implemented"
} satisfies SourceStaticCanvasCandidateConfig);
