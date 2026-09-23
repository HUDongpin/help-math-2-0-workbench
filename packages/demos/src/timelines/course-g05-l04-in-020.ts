import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_IN_020_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN20.swf",
  swfSha256:
    "6415d18872667a0acec32e361afe5d8091ba5a0d680a84cb8ed44b4b1238d1d9",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN20.fla",
  flaSha256:
    "ecd41c6bcfbad5b05022f77dc56f598701ca9996c9e67796be9856ffb45f7e38",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN20.mp3",
  associatedAudioSha256:
    "f5a178f2cb222b265736bf7f388a5c7861552023cb1e1cae59db39588da6b93d",
  spriteObjectId: 37,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_IN_020_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-020",
  title:
    "Number Lines: Situations with Negative Integers — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_020_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-020/canvas-renderer.js",
  assetSha256:
    "a648ca2be956f1cbe1bd88849f02454cf2003afa65301a72b7faa807203bfb08",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-37",
  mainFrameCount: 282,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-integer-situations-source-drawing", firstFrame: 1, lastFrame: 282}),
  ]),
  sourceControlBehaviorLabel:
    "Nine source buttons, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled; once is a current-JavaScript clamp only",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_020_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
