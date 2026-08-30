import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_VB_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB02.swf",
  swfSha256:
    "44d49533e15392fc67188c27ababb2e83cae8e181881ed94bf0341fa85509824",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB02.fla",
  flaSha256:
    "851d93c321c7f47bafd2c9a1b7691eb3b2a82b59b82726501f83578316fd8ba1",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB02.mp3",
  associatedAudioSha256:
    "cbd30ee67b4367c49b0ced62039cccda2bf845c5739fe36ae5ff23bc0681287b",
  spriteObjectId: 49,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

export const COURSE_G05_L04_VB_002_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-002",
  title:
    "Number Lines: Important Words — Numbers on a Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-002/canvas-renderer.js",
  assetSha256:
    "0c7ec104381d5b5a27e99015a1bd2f2ff7053be27bb5977af4e8fa75168e4d50",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-49",
  mainFrameCount: 186,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "number-line-vocabulary-source-drawing", firstFrame: 1, lastFrame: 186}),
  ]),
  sourceControlBehaviorLabel:
    "Six source vocabulary buttons, host callbacks, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
