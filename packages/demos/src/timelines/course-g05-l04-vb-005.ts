import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_VB_005_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB05.swf",
  swfSha256:
    "ecee1b1aea0aa8f2cef7b71b802629ffb6790699b13d3d9294503118f48e5541",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB05.fla",
  flaSha256:
    "61a02f89c162051e649145e53664f2f0d0ea545532e40b1126f83d0162d281a8",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB05.mp3",
  associatedAudioSha256:
    "b088ee9d1f2bca577770b3a600a748829cde83d8b766af8808e729df453a10f4",
  spriteObjectId: 46,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

export const COURSE_G05_L04_VB_005_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-005",
  title:
    "Number Lines: Important Words — Zero — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-005/canvas-renderer.js",
  assetSha256:
    "4b05d689c9ddb43f8029600647b32a3372eda6ec20b02cf008f28f533a78095e",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-46",
  mainFrameCount: 264,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "zero-vocabulary-source-drawing", firstFrame: 1, lastFrame: 264}),
  ]),
  sourceControlBehaviorLabel:
    "Five source vocabulary buttons, host callbacks, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
