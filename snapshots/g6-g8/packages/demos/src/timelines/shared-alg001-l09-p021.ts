import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L09_P021_SOURCE = Object.freeze({
  "calibrationId": "g678-alg-l09-simple-glossary-current-js-9-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/IN/L9IN09.swf",
    "sha256": "06ecfd5081aa7f13291c36ff69d854a684a179caea52cf15a257fa01be788c04"
  },
  "reviewedLane": "interactive-understood",
  "adapterFamily": "alg-l09-simple-glossary-source-static",
  "familyVisualPlaybackCalibrationPassed": false,
  "currentJavaScriptRegistered": false,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "productBlockers": [
    "alg-l09-simple-glossary-browser-product-calibration-pending"
  ],
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_ALG001_L09_P021_CONFIG = Object.freeze({
  "animationId": "shared-alg001-l09-p021",
  "title": "Identifying Relationships as Proportional or Non-Proportional — local-only ALG L9 glossary Current-JS candidate",
  "sourceSwfSha256": "06ecfd5081aa7f13291c36ff69d854a684a179caea52cf15a257fa01be788c04",
  "assetSource": "/flash-assets/g678-local/shared-alg001-l09-p021/canvas-renderer.js",
  "assetSha256": "2024ffc83152ff09dbe4dca1bbc8016795111f359ded74c904c528e52f845526",
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
  "mainFrameDomain": "sprite-59",
  "mainFrameCount": 999,
  "livePlaybackEndFrame": 999,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-59-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 999
    }
  ],
  "sourceControlBehaviorLabel": "ALG L9 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
