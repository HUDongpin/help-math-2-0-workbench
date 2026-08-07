import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_011_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 15,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB11.swf",
  swfSha256:
    "dd12bb87cffa76948020b1cfc34163f67fa4062bd286ea571bf4b08473709ba0",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB11.fla",
  flaSha256:
    "b561dd6e3e1a7ea154094c9d4d58495c7b84111204394d5c97a5e87f362d68fa",
  sourceStaticFrameDomain: "sprite-31",
  sourceStaticFrameCount: 153,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-011/manifest.json",
  candidateManifestSha256:
    "4a3e94f2b0a61abb9edc02238d69b85d4f4742ba8ab9cad25de497a9f920b2b2",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_011_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-011",
  title:
    "Formula — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_011_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-011/canvas-renderer.js",
  assetSha256:
    "0315d7255b5333cbbea8e8d25af42b8c8351a537ab6cd5032b3c5466a58b2947",
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
  mainFrameDomain: "sprite-31",
  mainFrameCount: 153,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-31-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 153,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_011_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
