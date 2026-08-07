import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_013_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 27,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN13.swf",
  swfSha256:
    "61c2b91cc84de4bb4a9a732e6c087512dc93785b28abdd1cb6b9cdd8595f1098",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN13.fla",
  flaSha256:
    "8f05b9b8d81208b2e41cfca7eec979bab6995853ec9bc8f9a9db730d88eec33a",
  sourceStaticFrameDomain: "sprite-222",
  sourceStaticFrameCount: 139,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-013/manifest.json",
  candidateManifestSha256:
    "baeccc4f3085c7a879ba537d3adb86829be10495e0dbef3ab350b94ddf977249",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_013_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-013",
  title:
    "Area of Complex Shapes Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_013_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-013/canvas-renderer.js",
  assetSha256:
    "c792c07a889e9c6b5a6c463105b810ec802e99975ba217c4690298141f4dd5de",
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
  mainFrameDomain: "sprite-222",
  mainFrameCount: 139,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-222-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 139,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_013_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
