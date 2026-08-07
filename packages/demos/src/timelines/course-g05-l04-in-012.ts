import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_IN_012_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN12.swf",
  swfSha256:
    "7a1fca07e71006642867e73fc6817257d97fef1fc6e337a3363a01627e79d3bb",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN12.fla",
  flaSha256:
    "73bf63871e336b15b6abd72c6b9aae0826bcd793b4571a0c1b0331937e0d2eb7",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN12.mp3",
  associatedAudioSha256:
    "2ebd955be1cc4ee6f2f89e55ef46074d704ff8cae3508648b866f94651380359",
  spriteObjectId: 48,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_IN_012_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-012",
  title:
    "Number Lines: Represent Positive and Negative Integers on a Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_012_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-012/canvas-renderer.js",
  assetSha256:
    "8861a29538e3cea708e87dbc9df98b02f23be6183503aa4a2cead8d3bfbda4fa",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-48",
  mainFrameCount: 298,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "represent-integers-number-line-source-drawing", firstFrame: 1, lastFrame: 298}),
  ]),
  sourceControlBehaviorLabel:
    "Six source buttons, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled; once is a current-JavaScript clamp only",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_012_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
