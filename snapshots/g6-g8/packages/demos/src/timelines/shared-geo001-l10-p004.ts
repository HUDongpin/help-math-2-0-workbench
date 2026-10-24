import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_GEO001_L10_P004_SOURCE = Object.freeze({
  "calibrationId": "g678-pure-linear-current-js-scaleout-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L10/RW/L10RW04.swf",
    "sha256": "40a8aed7100a0fdc1cee1153cd49041b34eba1ca6d035e203aa023254795a1ad"
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

export const SHARED_GEO001_L10_P004_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l10-p004",
  "title": "Page 3 — local-only pure-linear Current-JS candidate",
  "sourceSwfSha256": "40a8aed7100a0fdc1cee1153cd49041b34eba1ca6d035e203aa023254795a1ad",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l10-p004/canvas-renderer.js",
  "assetSha256": "77bb37704326be4b780ea90ba034df7eb1c1a383c146bfb8c725a2aa55e0be2a",
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
  "mainFrameDomain": "sprite-225",
  "mainFrameCount": 988,
  "livePlaybackEndFrame": 988,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-225-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 988
    }
  ],
  "sourceControlBehaviorLabel": "Pure-linear visual playback calibrated; embedded audio remains independently blocked.",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
