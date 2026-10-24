import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {NMS002_L11_P030_BEHAVIOR_IR_V1} from "../g678-advanced-manual/nms002-l11-p030";

export {NMS002_L11_P030_BEHAVIOR_IR_V1};

export const SHARED_NMS002_L11_P030_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/NMS002/L11/TI/L11TI05.swf",
    "sha256": "853d0c3350fc1c39dfc730eb369041d91565003b6bdeed238aece874b2e06913"
  },
  "reviewedLane": "behavior-heavy",
  "adapterFamily": "advanced-manual-choice-quiz",
  "runtimePath": "work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1/members/shared-nms002-l11-p030/canvas-renderer.js",
  "runtimeRegistry": "HELP_MATH_CANVAS_ASSETS",
  "behaviorSpecification": {
    "path": "packages/demos/src/g678-advanced-manual/nms002-l11-p030.ts",
    "bytes": 16871,
    "sha256": "9ba0a199b2b310f11a43ec5f28939706d0dbd434c0edd537883288c5eb234d04"
  },
  "currentJavaScriptRegistered": false,
  "privateCurrentJsModuleGenerated": true,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "requiresHostInteractiveStop": true,
  "interactiveStops": [
    {
      "id": "nms-question-frame-97",
      "frameDomain": "sprite-260",
      "stopFrame": 97,
      "resumeFrame": 98,
      "resolution": "explicit-source-feedback-finished",
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

export const SHARED_NMS002_L11_P030_CONFIG = Object.freeze({
  "animationId": "shared-nms002-l11-p030",
  "title": "Question 4 — local-only advanced-manual Current-JS engineering candidate",
  "sourceSwfSha256": "853d0c3350fc1c39dfc730eb369041d91565003b6bdeed238aece874b2e06913",
  "assetSource": "/flash-assets/g678-local/shared-nms002-l11-p030/canvas-renderer.js",
  "assetSha256": "f1a120e9c7c126d8d70433d917f8fa34fda45b1a37c751617f9a0094f65762c3",
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
  "mainFrameDomain": "sprite-260",
  "mainFrameCount": 356,
  "livePlaybackEndFrame": 356,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "companionDomains": [
    {
      "id": "sprite-124",
      "frameCount": 30,
      "label": "Mc_Wrong_Feed1 audio domain (blocked)"
    },
    {
      "id": "sprite-112",
      "frameCount": 30,
      "label": "Mc_Wrong_Feed2 audio domain (blocked)"
    },
    {
      "id": "sprite-101",
      "frameCount": 30,
      "label": "Mc_Wrong_Feed3 audio domain (blocked)"
    },
    {
      "id": "sprite-90",
      "frameCount": 30,
      "label": "Mc_Wrong_Feed4 audio domain (blocked)"
    },
    {
      "id": "sprite-215",
      "frameCount": 27,
      "label": "Mc_Right_Feed1 audio domain (blocked)"
    },
    {
      "id": "sprite-150",
      "frameCount": 31,
      "label": "Mc_Right_Feed2 audio domain (blocked)"
    },
    {
      "id": "sprite-251",
      "frameCount": 28,
      "label": "Mc_Right_Feed3 audio domain (blocked)"
    },
    {
      "id": "sprite-223",
      "frameCount": 27,
      "label": "Mc_Right_Feed4 audio domain (blocked)"
    },
    {
      "id": "sprite-182",
      "frameCount": 25,
      "label": "Mc_Right_Feed5 audio domain (blocked)"
    }
  ],
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-260-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 356
    }
  ],
  "sourceControlBehaviorLabel": "Maintained advanced-manual controls; remaining blockers: adobe-random-state-parity-unaccepted, hint-host-content-not-reconstructed, nine-feedback-audio-domains-unaccepted, spanish-source-behavior-unavailable, original-runtime-and-fidelity-unaccepted",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
