import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 374..541 begin quiz answer, feedback, and continuation states whose causal transitions depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_017_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN17.swf",
  swfSha256:
    "9e773e9378d863805e3740db4e094f94e85d005f257ef1c3f58fe58c7617aa2b",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN17.mp3",
  associatedAudioSha256:
    "45327aafcf91150f495548027695899c888af5f7de88f4e7a5d9aa0af29f38f5",
  spriteObjectId: 494,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_IN_017_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-017",
  title:
    "Placing Numbers on a Number Line Practice — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_017_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-017/canvas-renderer.js",
  assetSha256:
    "ff7979e70f93dc69c11088309201ef0ec685d95865a583db0bd9c9f356795fff",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-494",
  mainFrameCount: 541,
  livePlaybackEndFrame: 373,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 374, lastFrame: 541, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "placing-numbers-practice-page-17-source-drawing",
      firstFrame: 1,
      lastFrame: 373,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer, feedback, and continuation frames 374..541, source buttons, dynamic text, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_017_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
