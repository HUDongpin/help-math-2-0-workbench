import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 191..299 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_016_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN16.swf",
  swfSha256:
    "c3af6dd2af7373359aa0969b3875ebf88796ae5d243fd3bc29f504322195754f",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN16.mp3",
  associatedAudioSha256:
    "4d2c8785ddcce9218a0bb1dde711bf4b08110bd922ed4b8206e557ef1c2c788c",
  spriteObjectId: 264,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_IN_016_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-016",
  title:
    "Represent Positive and Negative Integers on a Number Line Practice — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_016_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-016/canvas-renderer.js",
  assetSha256:
    "2ad1c14ea8556f3da8074923d2448cdd7dd32ae6cf4ec43753c6147229322531",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-264",
  mainFrameCount: 299,
  livePlaybackEndFrame: 190,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 191, lastFrame: 299, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "represent-integers-practice-page-16-source-drawing",
      firstFrame: 1,
      lastFrame: 190,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 191..299, source controls, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_016_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
