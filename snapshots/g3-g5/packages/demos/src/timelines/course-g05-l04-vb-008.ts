import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_VB_008_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB08.swf",
  swfSha256:
    "f5d08de21136d4ec00147f0fa1060b00a4abe84d13c99c4dae98721411dfe217",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB08.fla",
  flaSha256:
    "dfba606b201cdacb10db60f5074999a10ed388bb76486e353e4f946dae454c50",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB08.mp3",
  associatedAudioSha256:
    "9fc79abe55a22dafcc4d16916f360a0a14c57660c8cd455b6d0cba9d9792691c",
  spriteObjectId: 50,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

export const COURSE_G05_L04_VB_008_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-008",
  title:
    "Number Lines: Positive Integers — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-008/canvas-renderer.js",
  assetSha256:
    "ca3341ef5d32d587841c4b753f92471796bcdf1b90390861c7e5de6558bef6fc",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-50",
  mainFrameCount: 197,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "positive-integers-source-drawing", firstFrame: 1, lastFrame: 197}),
  ]),
  sourceControlBehaviorLabel:
    "Four source buttons, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled; once is a current-JavaScript clamp only",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
