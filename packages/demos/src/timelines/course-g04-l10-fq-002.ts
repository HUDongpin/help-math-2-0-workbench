import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_FQ_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 45,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ02.swf",
  swfSha256:
    "850ddbc1aeda20aa782d614a4ad44aae7e2ac8242b47fc27882860208c99d9ea",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ02.fla",
  flaSha256:
    "c73eaa76438956aaac0aafd013e10ae7f3911b9a18b94047bf6b8bf4e27e229a",
  sourceStaticFrameDomain: "sprite-823",
  sourceStaticFrameCount: 70,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 7350, y: 4322}),
    placementPixels: Object.freeze({x: 367.5, y: 216.1}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-fq-002/manifest.json",
  candidateManifestSha256:
    "ad7a83efa30ad3e8cfcb9d3688f4d9420f43e65cc28e9711e52d54cf98eedb7d",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_FQ_002_CONFIG = Object.freeze({
  animationId: "course-g04-l10-fq-002",
  title:
    "Page 1 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_FQ_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-fq-002/canvas-renderer.js",
  assetSha256:
    "1155bb2a8a59b83076e4265581631c11e22ccc5b3c697842ac363ac18920cd38",
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
  mainFrameDomain: "sprite-823",
  mainFrameCount: 70,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-823-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 70,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_FQ_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
