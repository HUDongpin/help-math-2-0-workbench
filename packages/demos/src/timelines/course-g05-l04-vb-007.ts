import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 53..136 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_VB_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB07.swf",
  swfSha256:
    "d9961e8ede43f668b656897af89e0e122c94bb0892a81a255cdea1b22835a869",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB07.fla",
  flaSha256:
    "cd30bf89d94b20f27164d5aae6997b13f354c8ae602baffa946e2089481522cb",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB07.mp3",
  associatedAudioSha256:
    "8a151164f285c720380d9e39be8c948e8d792b93acc09aa4ff6d36c543e91b0f",
  spriteObjectId: 230,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_VB_007_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-007",
  title: "Opposites — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-007/canvas-renderer.js",
  assetSha256:
    "aa16e19e27ac9df676715c92bfeef2400a4f9821a6d2475d134f05569e7ca896",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-230",
  mainFrameCount: 136,
  livePlaybackEndFrame: 52,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 53, lastFrame: 136, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "opposites-page-7-source-drawing",
      firstFrame: 1,
      lastFrame: 52,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 53..136, source controls, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_007_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
