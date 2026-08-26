import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TI_005_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 34,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI05.swf",
  swfSha256:
    "dbbf0e7c4a38a7628320b0b6cbd315aab08f628b6357fec79c67a9a7693aaafa",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI05.fla",
  flaSha256:
    "e758451b1b756e0cb1c0801eb3b0b61515c2baa2017f053b2d816ee3aa8f302a",
  sourceStaticFrameDomain: "sprite-263",
  sourceStaticFrameCount: 514,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ti-005/manifest.json",
  candidateManifestSha256:
    "1551f405b7a930fd673ad28ebc374ffbfb655d7e0af6de89821b9e19ecd50d7c",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TI_005_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ti-005",
  title:
    "Question 4 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TI_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ti-005/canvas-renderer.js",
  assetSha256:
    "1e3fc843555c11bc9334b4d253e56397638df12008f68d8495fbcc2811f4131b",
  stage: Object.freeze({
    width: 799.9,
    height: 599.75,
    backgroundColor: "#b8d8f7",
  }),
  nativeStage: Object.freeze({
    width: 799.9,
    height: 599.75,
    backgroundColor: "#b8d8f7",
  }),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-263",
  mainFrameCount: 514,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-263-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 514,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TI_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
