import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_015_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 29,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN15.swf",
  swfSha256:
    "2cd5470dacbf75e1a0799cb265a4cc6b4dd262db830abb5008cb0f689cf701d1",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN15.fla",
  flaSha256:
    "cd6aab7cfef2cc147778aea491b7a65744536396eec0908ef4b84fd1a0cf00b9",
  sourceStaticFrameDomain: "sprite-75",
  sourceStaticFrameCount: 743,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-015/manifest.json",
  candidateManifestSha256:
    "216c7be66fa1c7053d29881e3b164f073bacefb8648ff669ecdc3e838c56017b",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_015_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-015",
  title:
    "Same Areas, Different Perimeters — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_015_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-015/canvas-renderer.js",
  assetSha256:
    "8e239ff5f977d18d336fb89963fc8019b914d58b68670ca817b59bbeea7ab78a",
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
  mainFrameDomain: "sprite-75",
  mainFrameCount: 743,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-75-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 743,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_015_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
