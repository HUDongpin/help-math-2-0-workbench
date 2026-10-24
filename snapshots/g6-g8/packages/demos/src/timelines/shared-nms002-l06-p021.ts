import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L06_P021_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L6/IN/L6IN11.swf",
    "sha256": "e2fc42afca953439ddeda6312c5f668bcbb54f1f76be964ca00466b97004e6f9"
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

export const SHARED_NMS002_L06_P021_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l06-p021",
  "title": "Multiplying Decimals — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "e2fc42afca953439ddeda6312c5f668bcbb54f1f76be964ca00466b97004e6f9",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l06-p021/canvas-renderer.js",
  "assetSha256": "40be6eb18d87f99770b1c8de8ad3e3c5ba0b80d8347a5ea34daa4385c6102071",
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
  "mainFrameDomain": "sprite-20",
  "mainFrameCount": 962,
  "livePlaybackEndFrame": 962,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-20-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 962
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
