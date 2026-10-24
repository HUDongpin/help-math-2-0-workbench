import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L11_P015_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L11/IN/L11IN05.swf",
    "sha256": "5680e278b78c0df22baa81ff950638732c7ac731b7c3caa823e9a937baffc059"
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

export const SHARED_ALG001_L11_P015_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l11-p015",
  "title": "Inequalities on a Number Line — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "5680e278b78c0df22baa81ff950638732c7ac731b7c3caa823e9a937baffc059",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l11-p015/canvas-renderer.js",
  "assetSha256": "4fa3dff145c5b00003f042eaddd131ad7fc30626503c0964c34d2ca96dfb1974",
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
  "mainFrameDomain": "sprite-117",
  "mainFrameCount": 739,
  "livePlaybackEndFrame": 739,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-117-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 739
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
