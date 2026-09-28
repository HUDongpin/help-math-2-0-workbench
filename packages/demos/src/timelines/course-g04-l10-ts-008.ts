import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TS_008_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 43,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS08.swf",
  swfSha256:
    "59299d4acf780a24e5f221fb1f4fe5e9a8330303367b9632c7b1ff2d6bf7b3a5",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-413",
  sourceStaticFrameCount: 785,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8247, y: 5658}),
    placementPixels: Object.freeze({x: 412.35, y: 282.9}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ts-008/manifest.json",
  candidateManifestSha256:
    "70387a000123443dd86f85651d6e47917c2e6ee2f00c663191b1ed56b5081c28",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TS_008_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ts-008",
  title:
    "Question 2 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TS_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ts-008/canvas-renderer.js",
  assetSha256:
    "672dd74d24998cb42786455cc4a2867f34cb0c5a29dc617ba0e5585d843f9d6c",
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
  mainFrameDomain: "sprite-413",
  mainFrameCount: 785,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-413-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 785,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TS_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
