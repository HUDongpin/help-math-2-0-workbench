import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_007_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 21,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN07.swf",
  swfSha256:
    "a8f102560e35eea74b1b281aad05c7f860d789ac81e860a61fc685f0f8e672da",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-118",
  sourceStaticFrameCount: 964,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-007/manifest.json",
  candidateManifestSha256:
    "f869d4b2426d5f538fcb075c3c2557b35430281a3ba29ea9d832f293eb5021f8",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_007_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-007",
  title:
    "Perimeter of Other Shapes — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-007/canvas-renderer.js",
  assetSha256:
    "a7af32850b5bd2f2c58b1366af3a2869b3baebbe1764b23dbba5a7f8cb028fea",
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
  mainFrameCount: 964,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-118-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 964,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_007_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
