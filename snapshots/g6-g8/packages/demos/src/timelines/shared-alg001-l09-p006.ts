import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P006_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-terminal-stop-current-js-3-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/RW/L9RW06.swf",
    "sha256": "6c785af7fd08974cf5a7e05239970e6aae351b662575fba1d9bb417382987b70"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-terminal-stop-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-terminal-stop-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P006_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p006",
  "title": "Page 5 — local-only ALG L9 terminal-stop Current-JS candidate",
  "sourceSwfSha256": "6c785af7fd08974cf5a7e05239970e6aae351b662575fba1d9bb417382987b70",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p006/canvas-renderer.js",
  "assetSha256": "a219a95ebd7781ede1017e0a98557e20e5418f1bf0b616e8c91679f3c1e71fcc",
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
  "mainFrameDomain": "sprite-137",
  "mainFrameCount": 721,
  "livePlaybackEndFrame": 721,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-137-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 721
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 source-terminal-stop candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
