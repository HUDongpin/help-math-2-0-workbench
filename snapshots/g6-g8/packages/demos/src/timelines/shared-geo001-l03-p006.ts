import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L03_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L3/RW/L3RW06.swf",
    "sha256": "20435395917f13aa1e6f453850a8863f3d8a675b8acf0313fce39f9ce71e7dc6"
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

export const SHARED_GEO001_L03_P006_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l03-p006",
  "title": "Page 5 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "20435395917f13aa1e6f453850a8863f3d8a675b8acf0313fce39f9ce71e7dc6",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l03-p006/canvas-renderer.js",
  "assetSha256": "c5b1e608463eb548ceb2f4ba2ba9e634a230e67d0dd66646d2c249c58c60faa2",
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
  "mainFrameCount": 1058,
  "livePlaybackEndFrame": 1058,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-117-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 1058
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
