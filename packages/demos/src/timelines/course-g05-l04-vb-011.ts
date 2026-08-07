import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 33..81 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_VB_011_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB11.swf",
  swfSha256:
    "2a388d578bb23fa2d4054ace2c3640956dd1f2ea0afd8e4e68a21b1537944cf8",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB11.fla",
  flaSha256:
    "68db94b1a2c01f34fbd3affa29e144f48c207709bcd9070217e2d29d434e6cbe",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB11.mp3",
  associatedAudioSha256:
    "a3a54b8c6869c1fc1cfd28ebe9000dff84b8e8730a232bd154c14bc0c00a497d",
  spriteObjectId: 225,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_VB_011_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-011",
  title: "Integers Practice — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_011_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-011/canvas-renderer.js",
  assetSha256:
    "1de92806431f00e750310d6b6da78eda7114e9ee8358c021afe1827665a3c568",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-225",
  mainFrameCount: 81,
  livePlaybackEndFrame: 32,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 33, lastFrame: 81, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "integers-practice-page-11-source-drawing",
      firstFrame: 1,
      lastFrame: 32,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 33..81, source controls, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_011_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
