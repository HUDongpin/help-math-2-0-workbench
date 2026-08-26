import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 6,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB02.swf",
  swfSha256:
    "a46fa315148118d58a379a2d7b921684f5a0a210c72cae9433550e755ae42a81",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB02.fla",
  flaSha256:
    "96b00648f79801c9be8fed6ab422c6b6235c494b75533d80bd4a31e8b7ad3544",
  sourceStaticFrameDomain: "sprite-84",
  sourceStaticFrameCount: 280,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-002/manifest.json",
  candidateManifestSha256:
    "e1c06a467c9cfe5c1e4b55c85712b98623fc44617fca21e1d91570beb099cf05",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_002_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-002",
  title:
    "Measure — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-002/canvas-renderer.js",
  assetSha256:
    "d7561232bf59c58bf42c6088523826a7c5804cb7ae67dcbbe3cfa64de245adcd",
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
  mainFrameDomain: "sprite-84",
  mainFrameCount: 280,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-84-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 280,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
