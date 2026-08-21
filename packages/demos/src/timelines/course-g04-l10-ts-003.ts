import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TS_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 38,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS03.swf",
  swfSha256:
    "2dcad2e8fa1bc6908ee6ebe555ceccf85b5fe7ac170b652aa092c74b14740722",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS03.fla",
  flaSha256:
    "4a5fc3b270f1222f336e80a08250fb7e347da6f498b0e00a374fecaee5ea92f1",
  sourceStaticFrameDomain: "sprite-27",
  sourceStaticFrameCount: 227,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ts-003/manifest.json",
  candidateManifestSha256:
    "22bd73e6f45204f311ca176c118eb63177e779062b6c78fac493664918a2844c",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TS_003_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ts-003",
  title:
    "4 - Step Plan — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TS_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ts-003/canvas-renderer.js",
  assetSha256:
    "93321ee9e0d3fe88caf115198d7995d13ac61f2e9f6b21d166e0187259d16094",
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
  mainFrameDomain: "sprite-27",
  mainFrameCount: 227,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-27-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 227,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TS_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
