import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L03_P001_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L3/IR/L3IR01.swf",
    "sha256": "36bdd014717f47565080bdc33d2422ffecc5fd64b093664e49977541c6f20504"
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

export const SHARED_ALG001_L03_P001_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l03-p001",
  "title": "Introduction — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "36bdd014717f47565080bdc33d2422ffecc5fd64b093664e49977541c6f20504",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l03-p001/canvas-renderer.js",
  "assetSha256": "8d77651c5669fdb0b66164a70ef8a9470489d665b0911362fe0e6bf4a4016143",
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
  "mainFrameDomain": "sprite-28",
  "mainFrameCount": 138,
  "livePlaybackEndFrame": 138,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-28-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 138
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
