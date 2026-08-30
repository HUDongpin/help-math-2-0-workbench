import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 17,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN03.swf",
  swfSha256:
    "4bd6c332318774ca1f4d1adeb7057733d96bc4287e9230901103930ac5fa55b8",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN03.fla",
  flaSha256:
    "9630242fa590cfa2000fd5e68a329a5f48a935f216abb478f3922c74aa094aed",
  sourceStaticFrameDomain: "sprite-90",
  sourceStaticFrameCount: 361,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-003/manifest.json",
  candidateManifestSha256:
    "b9447fa334e2e1babef02e23f10d92f0e3c6c266e72121361a6b72fd09249c03",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_003_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-003",
  title:
    "Measure Length and Width Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-003/canvas-renderer.js",
  assetSha256:
    "1bf7fe244183dd15e9f3f6d591d57a0dace05229505179b4738d6c6fcae79557",
  stage: Object.freeze({
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  }),
  nativeStage: Object.freeze({
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  }),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-90",
  mainFrameCount: 361,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-90-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 361,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
