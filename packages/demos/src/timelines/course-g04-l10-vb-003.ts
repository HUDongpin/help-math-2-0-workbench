import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 7,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
  swfSha256:
    "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla",
  flaSha256:
    "1eccb733544de8eb0fa718cac6a1792e2e58145c737f6170e56268fc212003f7",
  sourceStaticFrameDomain: "sprite-120",
  sourceStaticFrameCount: 203,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-003/manifest.json",
  candidateManifestSha256:
    "bf85e1e1b77939c5b82933e3dc9a47c3ef2ba41bf65916d7ac1c3a050c9f6da7",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_003_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-003",
  title:
    "Unit of Measurement — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-003/canvas-renderer.js",
  assetSha256:
    "5923392682aa868e7348e31c3db7bbab1d1ef34861c4af641b0ac71385b583ee",
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
  mainFrameDomain: "sprite-120",
  mainFrameCount: 203,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-120-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 203,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
