import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L10_P024_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L10/IN/L10IN10.swf",
    "sha256": "fb5b269607f41c608e0d4d45aa1eb75fd4c61585167f235dbfeca2e47e12fc4f"
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

export const SHARED_GEO001_L10_P024_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l10-p024",
  "title": "Plotting Geometric Figures — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "fb5b269607f41c608e0d4d45aa1eb75fd4c61585167f235dbfeca2e47e12fc4f",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l10-p024/canvas-renderer.js",
  "assetSha256": "48f3c7285da4541085bf7cac81362b03c5d37501327549b8a30df8b7bca42a18",
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
  "mainFrameDomain": "sprite-51",
  "mainFrameCount": 403,
  "livePlaybackEndFrame": 403,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-51-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 403
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
