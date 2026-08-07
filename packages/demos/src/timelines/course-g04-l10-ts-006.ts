import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TS_006_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 41,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS06.swf",
  swfSha256:
    "b0ad832f7d755e2f94dddc53e3267414c5d8430ed0e8c28d498cc5ec3c05160e",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS06.fla",
  flaSha256:
    "4991dd4d87468d7c9162a88c94a15b8c7d251bc240e4c855b7b470976e887eb8",
  sourceStaticFrameDomain: "sprite-13",
  sourceStaticFrameCount: 245,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8241, y: 5668}),
    placementPixels: Object.freeze({x: 412.05, y: 283.4}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ts-006/manifest.json",
  candidateManifestSha256:
    "698ba38db06bf0978234280c2cf63f358f2ab918f4de56d4b60e75188b663bc6",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TS_006_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ts-006",
  title:
    "4 - Step Plan — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TS_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ts-006/canvas-renderer.js",
  assetSha256:
    "ba4ab8464a6351576ee17bcd3ea0a542a0589652b9c6038b1da61328c02b2695",
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
  mainFrameDomain: "sprite-13",
  mainFrameCount: 245,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-13-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 245,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TS_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
