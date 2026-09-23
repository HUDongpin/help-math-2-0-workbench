import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_FQ_001_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 41,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ01.swf",
  swfSha256:
    "9226553896cda584d9c03f784bc6f104ac4a9a80c3f6128bf14268f9719d7ba7",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ01.fla",
  flaSha256:
    "3a0ce0652238505348f2fba067546b0533149a68b681f9df3fffe4f455be0d73",
  sourceStaticFrameDomain: "sprite-68",
  sourceStaticFrameCount: 52,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "10",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l11-fq-001/manifest.json",
  candidateManifestSha256:
    "11be2338e527ff4b367fb4b6980663a4e82bd4dbd6ff3e67e6330f27b24be734",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: true,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_FQ_001_CONFIG = Object.freeze({
  animationId: "course-g04-l11-fq-001",
  title:
    "Introduction — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L11_FQ_001_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-fq-001/canvas-renderer.js",
  assetSha256:
    "23163b17db9a3e0bbdf9d74aa019755ddefa914ac2c5cf23f7735c0eff4fb6bd",
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
  mainFrameDomain: "sprite-68",
  mainFrameCount: 52,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-68-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 52,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_FQ_001_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
