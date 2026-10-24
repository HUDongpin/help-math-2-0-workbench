import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_010_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 24,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN10.swf",
  swfSha256:
    "6c39e74f67b6b1c678f5836fb204d750675118a46254facfae89c2455d66d726",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN10.fla",
  flaSha256:
    "d022be7f26b8fccade8945527a7aa63bfb252414dcd31a0dbeccbd1ee694ef77",
  sourceStaticFrameDomain: "sprite-111",
  sourceStaticFrameCount: 436,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-010/manifest.json",
  candidateManifestSha256:
    "80ba82daa19b7b3202c1bd3785805a58a41021bddae0e827fbd85fde25a893f0",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_010_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-010",
  title:
    "Area Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_010_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-010/canvas-renderer.js",
  assetSha256:
    "b0d8a17ceb24c70302bdcae88bfe30e0579ede1390d4eee0739d7e89196d30f4",
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
  mainFrameDomain: "sprite-111",
  mainFrameCount: 436,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-111-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 436,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_010_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
