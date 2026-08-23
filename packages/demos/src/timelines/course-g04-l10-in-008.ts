import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_008_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 22,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN08.swf",
  swfSha256:
    "7f089cf7aa466477a103341fca1bd87fde93fbb94eab32fdaac10f7b08a94d2c",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN08.fla",
  flaSha256:
    "30a91bf0b0180ec312a59f4c21e033d45cebbb344a2ce2fee6c2a063943b80cd",
  sourceStaticFrameDomain: "sprite-210",
  sourceStaticFrameCount: 129,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-008/manifest.json",
  candidateManifestSha256:
    "b0c8c963e00b544e0861676b65e3f8dcbd6df89c790084c6c6032e1cf7675828",
  actionScriptExecuted: false,
  audioCues: Object.freeze([
    Object.freeze({
      id: "in008-main",
      sourceTimelineId: "sprite-210",
      firstFrame: 5,
      sourceStopFrame: 52,
      correctContinuationFirstFrame: 53,
      terminalFrame: 129,
    }),
  ]),
  controlsEnabled: true,
  registered: true,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_008_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-008",
  title:
    "Perimeter of Other Shapes Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-008/canvas-renderer.js",
  assetSha256:
    "97c664f3b5971e934b958c3baaafe82e9d254e913a3625364756e308ddf9c53f",
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
  mainFrameDomain: "sprite-210",
  mainFrameCount: 129,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-210-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 129,
    }),
  ]),
  sourceControlBehaviorLabel:
    "V32 typed perimeter-practice/glossary/audio adapter closes product random branches, stop-52-to-terminal-129 reachability, and Replay engineering; ActionScript execution, natural Adobe runtime, listening acceptance, and fidelity remain unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
