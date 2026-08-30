import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_006_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 10,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB06.swf",
  swfSha256:
    "cb9881b4c6b790e4c1b13fa99ee3457b2d5438c261811d22d431b1fc0cefdaa4",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB06.fla",
  flaSha256:
    "2c809b81dedda337e6273197eaa29dcdd8275d16b250ed9a48837c3d1e0583e6",
  sourceStaticFrameDomain: "sprite-213",
  sourceStaticFrameCount: 104,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-006/manifest.json",
  candidateManifestSha256:
    "ba94ec772d18a54203f625c02a10bbcd42fe43755de736ad409eb9b0fcfe8325",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_006_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-006",
  title:
    "Length/Width Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-006/canvas-renderer.js",
  assetSha256:
    "95bd749be5a31d68bb6ac296efb90b36d1b6784b288ab20db0db226b0867f614",
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
  mainFrameDomain: "sprite-213",
  mainFrameCount: 104,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-213-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 104,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
