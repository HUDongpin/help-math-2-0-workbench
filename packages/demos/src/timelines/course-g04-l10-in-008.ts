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
    "31acf04aee77393cb4f8d1ad6f284645a099f8b20ba9b4940d96608802794878",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
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
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
