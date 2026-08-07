import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_016_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 30,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN16.swf",
  swfSha256:
    "a75e16f8707676152626d272643820076316029f9b1aa2e5b9938cf5f853e1d3",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN16.fla",
  flaSha256:
    "d41477d7dbb6b728f83b8df7a8325cc66cad9a04c290bb52da64628a97735de4",
  sourceStaticFrameDomain: "sprite-209",
  sourceStaticFrameCount: 81,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-016/manifest.json",
  candidateManifestSha256:
    "84e70246cd13e31d6e09452639b39ae142bc1a5a1de3d238db0c334cdb3e9356",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_016_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-016",
  title:
    "Same Area or Same Perimeter? — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_016_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-016/canvas-renderer.js",
  assetSha256:
    "4659e8d24b5e9f24d178579534bb8605a9e22395da6593f9625e97eefdedbc02",
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
  mainFrameCount: 81,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-209-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 81,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_016_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
