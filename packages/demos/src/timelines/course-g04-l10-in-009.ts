import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_009_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 23,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN09.swf",
  swfSha256:
    "6ab0100d0db4f3460fe71f836325cc821a5285b82ce470bfc961314a69ce7ef2",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN09.fla",
  flaSha256:
    "235081c52ea65826abddf9691aa3af6af5bb38944755ff20d2c1040b279cccec",
  sourceStaticFrameDomain: "sprite-89",
  sourceStaticFrameCount: 953,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-009/manifest.json",
  candidateManifestSha256:
    "71c23af7a69351596146c573f7e41801116947a114a1d65368f52d81af7bde03",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_009_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-009",
  title:
    "Area — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_009_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-009/canvas-renderer.js",
  assetSha256:
    "0a2c8054c5aa322a57ffb70e6cccc2e4b745ba76c97b9a6912c46ae8a320d84d",
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
  mainFrameDomain: "sprite-89",
  mainFrameCount: 953,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-89-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 953,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_009_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
