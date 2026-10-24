import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L11_P003_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L11/RW/L11RW03.swf",
    "sha256": "0902df529b01e04552fa44b7dc7e9e66730ea90a693ac8583601ee8d52b07ae0"
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

export const SHARED_GEO001_L11_P003_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l11-p003",
  "title": "Page 2 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "0902df529b01e04552fa44b7dc7e9e66730ea90a693ac8583601ee8d52b07ae0",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l11-p003/canvas-renderer.js",
  "assetSha256": "3e0655783e190202e1099a8a50433e6b93d0a3db8c07887abc6872f5226fdfd4",
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
  "mainFrameDomain": "sprite-166",
  "mainFrameCount": 699,
  "livePlaybackEndFrame": 699,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-166-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 699
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
