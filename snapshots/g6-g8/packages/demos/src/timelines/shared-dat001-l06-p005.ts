import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_DAT001_L06_P005_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L6/RW/L6RW05.swf",
    "sha256": "a470d677e7b09b83d621d7a3e48612cd252ccd026918db92b45a5d6e843cc97b"
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

export const SHARED_DAT001_L06_P005_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l06-p005",
  "title": "Page 4 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "a470d677e7b09b83d621d7a3e48612cd252ccd026918db92b45a5d6e843cc97b",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l06-p005/canvas-renderer.js",
  "assetSha256": "a36c502a3a3a379c076a1d347cae171f4db6902f0a11023b38873209016ee49c",
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
  "mainFrameDomain": "sprite-97",
  "mainFrameCount": 741,
  "livePlaybackEndFrame": 741,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-97-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 741
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
