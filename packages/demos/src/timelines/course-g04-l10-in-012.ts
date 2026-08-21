import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_012_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 26,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN12.swf",
  swfSha256:
    "3f2b5ae9f3eceb663422312fd3cf165cc707c74cc23584a4bc6f7fcb906aa29c",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-118",
  sourceStaticFrameCount: 1210,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-012/manifest.json",
  candidateManifestSha256:
    "ff784dbbcc4b851d3e9c3be6ea222ad42235d0886142de05a87284ae4128ed21",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_012_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-012",
  title:
    "Area of Complex Shapes — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_012_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-012/canvas-renderer.js",
  assetSha256:
    "586e5890b5ae0afcbd3dd31e3b821fb1a724d72b5c12c35e05a411b79f45885d",
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
  mainFrameDomain: "sprite-118",
  mainFrameCount: 1210,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-118-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 1210,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_012_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
