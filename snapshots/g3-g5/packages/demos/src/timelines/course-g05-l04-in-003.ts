import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 74..182 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN03.swf",
  swfSha256:
    "1de1f053323dfa1bb9ad1e7344d324faa27f7eaed07a782b906ade0684b29d95",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN03.fla",
  flaSha256:
    "f43ccbb580ed800e785c4ffed1f72c1026ff756dcedb4b2be7aaeceb59339a06",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN03.mp3",
  associatedAudioSha256:
    "0981e12136dbe0fffbdb857be3a8dc76c328bd7637c936e541e48c96fe7ac88f",
  spriteObjectId: 217,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_606}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 280.3}),
});

export const COURSE_G05_L04_IN_003_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-003",
  title:
    "Introduction to Number Lines — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-003/canvas-renderer.js",
  assetSha256:
    "4717ec6471a4a2f19eaba6ba55a55db3a4bbab4c40981e54f4555292e44f6c93",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-217",
  mainFrameCount: 182,
  livePlaybackEndFrame: 73,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 74, lastFrame: 182, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "introduction-number-lines-page-3-source-drawing",
      firstFrame: 1,
      lastFrame: 73,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 74..182, source controls, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
