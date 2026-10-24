import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {DAT001_L05_P040_BEHAVIOR_IR_V1} from "../g678-advanced-manual/dat001-l05-p040";

export {DAT001_L05_P040_BEHAVIOR_IR_V1};

export const SHARED_DAT001_L05_P040_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/DAT001/L5/TI/L5TI02.swf",
    "sha256": "0945d41f55d2c0746ccd4e7d820983f3eea2c49bf9c54e1f6174f5ee33d420f6"
  },
  "reviewedLane": "behavior-heavy",
  "adapterFamily": "advanced-manual-drag-drop-quiz",
  "runtimePath": "work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1/members/shared-dat001-l05-p040/canvas-renderer.js",
  "runtimeRegistry": "HELP_MATH_CANVAS_ASSETS",
  "behaviorSpecification": {
    "path": "packages/demos/src/g678-advanced-manual/dat001-l05-p040.ts",
    "bytes": 15822,
    "sha256": "35095b2f55f04d104908354f703e75601174d65a7b7d6c978d901ff50a78dd4c"
  },
  "currentJavaScriptRegistered": false,
  "privateCurrentJsModuleGenerated": true,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "requiresHostInteractiveStop": true,
  "interactiveStops": [
    {
      "id": "dat-drag-set-frame-238",
      "frameDomain": "sprite-315",
      "stopFrame": 238,
      "resumeFrame": 239,
      "resolution": "explicit-source-drag-set-finished",
      "completionDisposition": "blocked-while-unresolved",
      "requiresHostInteractiveStop": true,
      "strictAcceptanceEffect": "none"
    }
  ],
  "interactiveSeek": null,
  "requiresHostSeekConsumer": false,
  "hostSeekConsumerImplemented": true,
  "interactiveResolutionIntentContractImplemented": true,
  "interactiveStateQueryableThroughModuleGetFrameState": false,
  "feedbackVariantSelection": "source-host-cardinality-page-seed-v1",
  "audioLifecycleAccepted": false,
  "spanishBehaviorAccepted": false,
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_DAT001_L05_P040_CONFIG = Object.freeze({
  "animationId": "shared-dat001-l05-p040",
  "title": "Question 1 — local-only advanced-manual Current-JS engineering candidate",
  "sourceSwfSha256": "0945d41f55d2c0746ccd4e7d820983f3eea2c49bf9c54e1f6174f5ee33d420f6",
  "assetSource": "/flash-assets/g678-local/shared-dat001-l05-p040/canvas-renderer.js",
  "assetSha256": "bfe15341e4b321925ebbb558618800c8b07ae442c1d82260cd9515d2d590cf80",
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
  "mainFrameDomain": "sprite-315",
  "mainFrameCount": 254,
  "livePlaybackEndFrame": 254,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "companionDomains": [
    {
      "id": "sprite-202",
      "frameCount": 28,
      "label": "Mc_Wrong_Feed1 audio domain (blocked)"
    },
    {
      "id": "sprite-214",
      "frameCount": 29,
      "label": "Mc_Wrong_Feed2 audio domain (blocked)"
    },
    {
      "id": "sprite-226",
      "frameCount": 28,
      "label": "Mc_Wrong_Feed3 audio domain (blocked)"
    },
    {
      "id": "sprite-314",
      "frameCount": 33,
      "label": "Mc_Right_Feed1 audio domain (blocked)"
    },
    {
      "id": "sprite-258",
      "frameCount": 25,
      "label": "Mc_Right_Feed2 audio domain (blocked)"
    },
    {
      "id": "sprite-294",
      "frameCount": 28,
      "label": "Mc_Right_Feed3 audio domain (blocked)"
    },
    {
      "id": "sprite-266",
      "frameCount": 27,
      "label": "Mc_Right_Feed4 audio domain (blocked)"
    }
  ],
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-315-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 254
    }
  ],
  "sourceControlBehaviorLabel": "Maintained advanced-manual controls; remaining blockers: adobe-random-state-parity-unaccepted, replay-quiztrycount-reset-is-modern-product-assumption, seven-feedback-audio-domains-unaccepted, source-reset-references-unplaced-mc-wrong-feed4, spanish-source-behavior-unavailable, original-runtime-and-fidelity-unaccepted",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
