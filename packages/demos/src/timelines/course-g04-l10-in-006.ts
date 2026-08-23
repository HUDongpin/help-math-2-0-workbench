import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_006_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 20,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN06.swf",
  swfSha256:
    "6fc6b139221628b7035d42e404fe4de7420f9b487d2e64e63431ac096297a51b",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN06.fla",
  flaSha256:
    "e6c02646dc0b170442375d96f2a98b27a08112478d7a31519bedd451b60926c0",
  sourceStaticFrameDomain: "sprite-220",
  sourceStaticFrameCount: 141,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-006/manifest.json",
  candidateManifestSha256:
    "ced6edc1559a15aa7b02fa5940c56ae110e09ecdfba371505056c59a94f4d17d",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_006_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-006",
  title:
    "Perimeter Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-006/canvas-renderer.js",
  assetSha256:
    "8bbdd8f8e8e69cee85af8c48f8bd688ad0c5c4b6ce1ad9d3e3cf4dc64ba9e115",
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
  mainFrameDomain: "sprite-220",
  mainFrameCount: 141,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-220-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 141,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
