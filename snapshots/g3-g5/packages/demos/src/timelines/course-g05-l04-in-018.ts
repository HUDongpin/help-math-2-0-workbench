import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 218..275 begin quiz, NewProblem, Q2/Q3, answer, and feedback states whose causal transitions depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_018_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN18.swf",
  swfSha256:
    "902f48bf94bcd04fdcd2b2516c90103f7ed8c50a5371b306c086fed8a81a5257",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN18.fla",
  flaSha256:
    "da247ef9c33088cfe29ee9eb27901fd5783a0bda1b125db8ec958104bd7e699f",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN18.mp3",
  associatedAudioSha256:
    "2910b04f2398a838d8edea803d58c8d84de851957aecc660de40b9ea4ec5613d",
  spriteObjectId: 220,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_IN_018_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-018",
  title:
    "Placing Numbers on a Number Line Practice — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_018_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-018/canvas-renderer.js",
  assetSha256:
    "85ec6c2f4e864dbb37982532ea3882e3b01c8f69b6221996d3bd2a8a08160f7e",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-220",
  mainFrameCount: 275,
  livePlaybackEndFrame: 217,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 218, lastFrame: 275, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "placing-numbers-practice-page-18-source-drawing",
      firstFrame: 1,
      lastFrame: 217,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz, NewProblem, Q2/Q3, answer, and feedback frames 218..275, source buttons, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_018_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
