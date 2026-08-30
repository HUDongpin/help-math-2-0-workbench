import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TS_005_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 40,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS05.swf",
  swfSha256:
    "f0ec8f168ec7de0f20dc058730b02c880d9c8e81940b966e0bd2da2f3684d905",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS05.fla",
  flaSha256:
    "4a7f53072734b294da3df0dcbf8005779e5827ce393be814878ea7440cababaa",
  sourceStaticFrameDomain: "sprite-32",
  sourceStaticFrameCount: 234,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 7477, y: 5666}),
    placementPixels: Object.freeze({x: 373.85, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ts-005/manifest.json",
  candidateManifestSha256:
    "f104fb40bc427442d2781381e27830f381d147dfd8be11f798c3a0211e3a99fa",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TS_005_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ts-005",
  title:
    "4 - Step Plan — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TS_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ts-005/canvas-renderer.js",
  assetSha256:
    "58c8c0521f89e175f4ffdc25a0b2170fed86b88b4d5227fb643773b27b2d3525",
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
  mainFrameDomain: "sprite-32",
  mainFrameCount: 234,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-32-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 234,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TS_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
