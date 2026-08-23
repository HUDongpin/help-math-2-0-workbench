import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_FQ_001_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 44,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ01.swf",
  swfSha256:
    "e61c2020d7f0b37ba9975c9981aa745cc8a21fb0f36f9581e32e6ebb711dde65",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ01.fla",
  flaSha256:
    "3eb3d315f9ff22ba08138ef6fdf64e7c64bcc66402afc5630a9c14a1c9c8b6f3",
  sourceStaticFrameDomain: "sprite-50",
  sourceStaticFrameCount: 52,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "10",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-fq-001/manifest.json",
  candidateManifestSha256:
    "6afdfc5d62381c14357590057c510f67ae714ad58e1881ab6c68c1fc9e8b2bf8",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_FQ_001_CONFIG = Object.freeze({
  animationId: "course-g04-l10-fq-001",
  title:
    "Introduction — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_FQ_001_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-fq-001/canvas-renderer.js",
  assetSha256:
    "42b26bbc248df9c1b699b289cbf630161455744e9ba12629b347fe8ff58efaf1",
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
  mainFrameDomain: "sprite-50",
  mainFrameCount: 52,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-50-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 52,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_FQ_001_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
