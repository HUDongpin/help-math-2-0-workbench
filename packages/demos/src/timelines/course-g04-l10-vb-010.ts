import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_010_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 14,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB10.swf",
  swfSha256:
    "d62e103871123717762bc7e8dc8a72a2902ef6a69c1752f8a42e83f1f2419994",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB10.fla",
  flaSha256:
    "80cf93ffec52c4952d59ba6de46b7ed964eef65bdb35b0cc37bf80efa837d201",
  sourceStaticFrameDomain: "sprite-36",
  sourceStaticFrameCount: 128,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-010/manifest.json",
  candidateManifestSha256:
    "a50086cecb299cd96d326beb0cb8fedf54755cdcc84d65afc0d7a074c0693c92",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_010_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-010",
  title:
    "Square Unit — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_010_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-010/canvas-renderer.js",
  assetSha256:
    "7a4e594e6b53e5eafd455d0fb6afefdd29e4ee1a1d6de29fe54f605bc1e8c961",
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
  mainFrameDomain: "sprite-36",
  mainFrameCount: 128,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-36-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 128,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_010_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
