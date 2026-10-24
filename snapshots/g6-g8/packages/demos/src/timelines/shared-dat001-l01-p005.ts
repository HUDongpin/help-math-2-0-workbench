import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L01_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L1/RW/L1RW05.swf",
    "sha256": "4bd8da2329394f02dd03bc96cb8708f3ae617f8d760b0dfa6ca9964977aaf25f"
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

export const SHARED_DAT001_L01_P005_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l01-p005",
  "title": "Page 4 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "4bd8da2329394f02dd03bc96cb8708f3ae617f8d760b0dfa6ca9964977aaf25f",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l01-p005/canvas-renderer.js",
  "assetSha256": "5f1f1ae7e6609bbafcc83527a4b3b2ab92885c355fdcb7e32cb43bd74bc97807",
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
  "mainFrameDomain": "sprite-219",
  "mainFrameCount": 639,
  "livePlaybackEndFrame": 639,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-219-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 639
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
