import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_FQ_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 46,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ03.swf",
  swfSha256:
    "afa03a2a134bb5b1fe91fd3b2847b751cc65a07b0250940fca3a01e215976c39",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ03.fla",
  flaSha256:
    "cea922485510af755674585250b4b93a7433dd347828df2fe77d7db331014dd1",
  sourceStaticFrameDomain: "sprite-823",
  sourceStaticFrameCount: 70,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 7350, y: 4322}),
    placementPixels: Object.freeze({x: 367.5, y: 216.1}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-fq-003/manifest.json",
  candidateManifestSha256:
    "331235165b8f89250df4b20f470d8048fe5444c7f039f3ac720ed31de444b15b",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_FQ_003_CONFIG = Object.freeze({
  animationId: "course-g04-l10-fq-003",
  title:
    "Page 2 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_FQ_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-fq-003/canvas-renderer.js",
  assetSha256:
    "68d093253fcbf6e9c07f737873776823810402e4a5f00934ea674c4139fe51b7",
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

export const COURSE_G04_L10_FQ_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
