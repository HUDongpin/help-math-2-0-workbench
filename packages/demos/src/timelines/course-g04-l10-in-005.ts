import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_005_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 19,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN05.swf",
  swfSha256:
    "4b67f66ddbfc5c43d85eb2343affdb3dde3fc57a9840fbbb8cb0003b25d95d5f",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-103",
  sourceStaticFrameCount: 535,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-005/manifest.json",
  candidateManifestSha256:
    "ac5bfb220a5fa2d9435087d8353826f88ef5549c38efabd6b08303f6650030d1",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_005_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-005",
  title:
    "Perimeter Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-005/canvas-renderer.js",
  assetSha256:
    "0f1800747de5b72e02cbef9f64d474c1de49a75ecff638ed9cb8e7b828a264aa",
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
  mainFrameDomain: "sprite-103",
  mainFrameCount: 535,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-103-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 535,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
