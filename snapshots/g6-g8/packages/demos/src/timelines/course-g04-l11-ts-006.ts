import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_TS_006_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 38,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TS/L11TS06.swf",
  swfSha256:
    "e74b471bccece73607980b2b214fda81ee89c9f9a42f3bb1d331403193a8e4d8",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TS/L11TS06.fla",
  flaSha256:
    "cdf4d686ad577f094f44906befac10ae3684c6a527137cc1a648aa566294f5ed",
  sourceStaticFrameDomain: "sprite-23",
  sourceStaticFrameCount: 125,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8241, y: 5668}),
    placementPixels: Object.freeze({x: 412.05, y: 283.4}),
  }),
  sourceDomainPlan:
    "scripts/prepare-g4-l11-ts006-source-domain-disposition-plan.mjs",
  sourceDomainPlanCoreSha256:
    "720a59a723c98c99221b121b487b481b4e62522151d277023492c26ce2c6b1af",
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-ts-006/manifest.json",
  candidateManifestSha256:
    "cdc690bdcc74afa4cc67a58e7b4d74e2e62444919d15da90c1b3bf2280bcdf61",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  sourceDomainDeclarationApplied: false,
  registered: false,
  currentJavascriptCountEffect: 0,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_TS_006_CONFIG = Object.freeze({
  animationId: "course-g04-l11-ts-006",
  title:
    "Coordinate Grid: Practice Test — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L11_TS_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-ts-006/canvas-renderer.js",
  assetSha256:
    "2dbbcdf3d239e97aca298dc20cd36551da0fb7035efdb669a9f403cb895d8901",
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
  mainFrameDomain: "sprite-23",
  mainFrameCount: 125,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  companionDomains: Object.freeze([
    Object.freeze({
      id: "sprite-3",
      frameCount: 1,
      label: "separate source-static composite title domain",
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-23-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 125,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, stream audio, Spanish visuals, natural root runtime, sprite-3 compositing, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_TS_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
