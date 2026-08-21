import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_014_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 28,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN14.swf",
  swfSha256:
    "06ddeacfd5eb764f8b6f19c612fd6cfaee9d3661a2a4ea90579409ab6dc24c21",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN14.fla",
  flaSha256:
    "f507e189b08f26eb6f4b3be6c8650abd5ba315d935d6b73c7ff53f44d212ec01",
  sourceStaticFrameDomain: "sprite-75",
  sourceStaticFrameCount: 844,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-014/manifest.json",
  candidateManifestSha256:
    "5c4ef273b014ee465fe566492fb13bed88956371e6a2648a4219b6518e1005f0",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_014_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-014",
  title:
    "Same Perimeters, Different Areas — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_014_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-014/canvas-renderer.js",
  assetSha256:
    "a04f3246753925a07e07ccbbcc2255f9d016aad8cbb69cb1cdd529d555555532",
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
  mainFrameDomain: "sprite-75",
  mainFrameCount: 844,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-75-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 844,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_014_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
