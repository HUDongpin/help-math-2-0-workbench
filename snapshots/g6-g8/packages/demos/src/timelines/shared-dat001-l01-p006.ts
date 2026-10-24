import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L01_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L1/RW/L1RW06.swf",
    "sha256": "2fffee4be36950db23e32e3756850ad9f456d906d166c0b886986390fab6acc8"
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

export const SHARED_DAT001_L01_P006_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l01-p006",
  "title": "Page 5 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "2fffee4be36950db23e32e3756850ad9f456d906d166c0b886986390fab6acc8",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l01-p006/canvas-renderer.js",
  "assetSha256": "7333a94611a024df75bd643de4fb5760afcfa4605e15505d59141c5ce3b27065",
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
  "mainFrameDomain": "sprite-42",
  "mainFrameCount": 621,
  "livePlaybackEndFrame": 621,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-42-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 621
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
