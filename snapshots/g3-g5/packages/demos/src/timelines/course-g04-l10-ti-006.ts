import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TI_006_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 35,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI06.swf",
  swfSha256:
    "96b4d947d94d89c9273dc96806cf93b38b5df0e2e78304cde540f89ce6a93759",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI06.fla",
  flaSha256:
    "c0a5c9a6c4664dc8f077b92bfdc489aad6ea213811e85c3f6bba903b2d41ffc0",
  sourceStaticFrameDomain: "sprite-155",
  sourceStaticFrameCount: 336,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ti-006/manifest.json",
  candidateManifestSha256:
    "117586daf74d99aa7df0ffc8ff198f350fe1a8e4b92149da973e4429f6cf1ca5",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TI_006_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ti-006",
  title:
    "Question 5 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TI_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ti-006/canvas-renderer.js",
  assetSha256:
    "040453284785dc53d60e05b943954f574c4dff3d71703da3481c070426bffbed",
  stage: Object.freeze({
    width: 799.9,
    height: 599.75,
    backgroundColor: "#b8d8f7",
  }),
  nativeStage: Object.freeze({
    width: 799.9,
    height: 599.75,
    backgroundColor: "#b8d8f7",
  }),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-155",
  mainFrameCount: 336,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-155-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 336,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TI_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
