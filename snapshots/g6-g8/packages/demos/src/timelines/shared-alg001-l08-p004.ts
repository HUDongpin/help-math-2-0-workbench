import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L08_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L8/RW/L8RW04.swf",
    "sha256": "dce0186e666011aaa1f7eff2e3b8928765a56d84251a77549216e7f2a6ccbcad"
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

export const SHARED_ALG001_L08_P004_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l08-p004",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "dce0186e666011aaa1f7eff2e3b8928765a56d84251a77549216e7f2a6ccbcad",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l08-p004/canvas-renderer.js",
  "assetSha256": "53df920af92f9a9e7b06ed4e9d662374e3b829dbb9c1232b068477b549988c88",
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
  "mainFrameDomain": "sprite-293",
  "mainFrameCount": 906,
  "livePlaybackEndFrame": 906,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-293-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 906
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
