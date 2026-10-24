import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_NMS002_L02_P019_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L2/IN/L2IN04.swf",
    "sha256": "747f6f5a9ae223d718389b9d8e944fcffc1239031cd80252a2a51533115546da"
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

export const SHARED_NMS002_L02_P019_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l02-p019",
  "title": "Naming Fractions — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "747f6f5a9ae223d718389b9d8e944fcffc1239031cd80252a2a51533115546da",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l02-p019/canvas-renderer.js",
  "assetSha256": "a59796d4c8c4e9cb3d5470430a11fca00826bca4844a9ebe7f7acac3ff6685ba",
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
  "mainFrameDomain": "sprite-33",
  "mainFrameCount": 378,
  "livePlaybackEndFrame": 378,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-33-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 378
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
