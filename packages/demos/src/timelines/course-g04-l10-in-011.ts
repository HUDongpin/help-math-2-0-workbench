import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_011_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 25,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN11.swf",
  swfSha256:
    "c74b02b496c913d7d60cdad2c0667b426c582078b2a4fc7fc7a880a44209e2d5",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN11.fla",
  flaSha256:
    "aff70f494bafa30e5d4b4fd9275126b5a731c0454e290e631816af72541911d4",
  sourceStaticFrameDomain: "sprite-209",
  sourceStaticFrameCount: 125,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-011/manifest.json",
  candidateManifestSha256:
    "28ff1c75e37148a9f5d0b6e7aa2a0ee74a33654f35d2781a787d02aefec72970",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_011_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-011",
  title:
    "Area Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_011_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-011/canvas-renderer.js",
  assetSha256:
    "89c85ea34796fccd6b80347e6604153e5c5ceeb2d0ea6d52dfa1c7722e78ef17",
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
  mainFrameDomain: "sprite-209",
  mainFrameCount: 125,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-209-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 125,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_011_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
