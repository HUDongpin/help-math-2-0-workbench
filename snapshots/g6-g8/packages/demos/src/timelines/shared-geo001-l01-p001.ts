import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {GEO001_L01_P001_BEHAVIOR_IR_V1} from "../g678-advanced-manual/geo001-l01-p001";

export {GEO001_L01_P001_BEHAVIOR_IR_V1};

export const SHARED_GEO001_L01_P001_SOURCE = Object.freeze({
  "calibrationId": "g678-16-page-product-calibration-v1",
  "deploymentScope": "local-only",
  "source": {
    "path": "G6-G8-shared/GEO001/L1/IR/L1IR01.swf",
    "sha256": "3034f4bb5df7a2033a57aacf8de5ba1cbda5add4c2d30a7987bac0769403b226"
  },
  "reviewedLane": "behavior-heavy",
  "adapterFamily": "advanced-manual-scrubber",
  "runtimePath": "work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1/members/shared-geo001-l01-p001/canvas-renderer.js",
  "runtimeRegistry": "HELP_MATH_CANVAS_ASSETS",
  "behaviorSpecification": {
    "path": "packages/demos/src/g678-advanced-manual/geo001-l01-p001.ts",
    "bytes": 12192,
    "sha256": "0631784822484108f2161fc62065a94acde6b32168acb3a8b61fc952e8ddc565"
  },
  "currentJavaScriptRegistered": false,
  "privateCurrentJsModuleGenerated": true,
  "productCalibrationPassed": false,
  "engineeringPreviewReady": false,
  "requiresHostInteractiveStop": false,
  "interactiveStops": [],
  "interactiveSeek": {
    "id": "geo-source-progress-seek",
    "frameDomain": "sprite-142",
    "minimumFrame": 1,
    "maximumFrame": 127,
    "terminalFrame": 127,
    "resumeDisposition": "resume-only-when-nonterminal",
    "requiresHostSeekConsumer": true,
    "strictAcceptanceEffect": "none"
  },
  "requiresHostSeekConsumer": true,
  "hostSeekConsumerImplemented": true,
  "interactiveResolutionIntentContractImplemented": true,
  "interactiveStateQueryableThroughModuleGetFrameState": false,
  "feedbackVariantSelection": "not-applicable",
  "audioLifecycleAccepted": false,
  "spanishBehaviorAccepted": false,
  "strictAcceptanceEffect": "none"
} as const);

export const SHARED_GEO001_L01_P001_CONFIG = Object.freeze({
  "animationId": "shared-geo001-l01-p001",
  "title": "Introduction — local-only advanced-manual Current-JS engineering candidate",
  "sourceSwfSha256": "3034f4bb5df7a2033a57aacf8de5ba1cbda5add4c2d30a7987bac0769403b226",
  "assetSource": "/flash-assets/g678-local/shared-geo001-l01-p001/canvas-renderer.js",
  "assetSha256": "9eaff53cdf088e3379b710d604aaf9ccdf40ab4f7aab24580cb2a99245a16d96",
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
  "mainFrameDomain": "sprite-142",
  "mainFrameCount": 127,
  "livePlaybackEndFrame": 127,
  "playbackMode": "once",
  "strictCaptureIdentity": true,
  "companionDomains": [
    {
      "id": "sprite-11-progress-bar",
      "frameCount": 2,
      "label": "source progress-bar linkage (product range adapter active; source placement unresolved)"
    }
  ],
  "blockedFrameRanges": [],
  "visualMarkers": [
    {
      "id": "sprite-142-ffdec-drawing",
      "firstFrame": 1,
      "lastFrame": 127
    }
  ],
  "sourceControlBehaviorLabel": "Maintained advanced-manual controls; remaining blockers: source-media-controls-and-fui-linkage-placement-unproven, embedded-audio-lifecycle-unaccepted, spanish-source-behavior-unavailable, original-runtime-and-fidelity-unaccepted",
  "showEngineeringDisclosure": false
} satisfies SourceStaticCanvasCandidateConfig);
