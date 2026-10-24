import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L05_P029_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L5/IN/L5IN12.swf",
    "sha256": "9691aec726e451e3ccea2bf8a1d6c6f14cc2bfb12cfb6f6e61847bffc71fecc7"
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

export const SHARED_DAT001_L05_P029_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l05-p029",
  "title": "Probability Outcomes — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "9691aec726e451e3ccea2bf8a1d6c6f14cc2bfb12cfb6f6e61847bffc71fecc7",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l05-p029/canvas-renderer.js",
  "assetSha256": "27267f2e988173d4b546adc62bf2593457aa685a29e2f3ee5afe19fb1dae96f5",
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
  "mainFrameDomain": "sprite-26",
  "mainFrameCount": 786,
  "livePlaybackEndFrame": 786,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-26-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 786
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
