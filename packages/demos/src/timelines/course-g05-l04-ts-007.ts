import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 264..684 begin the first stop- and release-handler-controlled interaction and include later staged interactions whose progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TS_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS07.swf",
  swfSha256:
    "9930c5a1ea224e73cbd4c8a0f17b281a94c4214dfefc368b75881bc629d9114d",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS07.fla",
  flaSha256:
    "869be30df72b9287f3b169b22e4ee49e4efa5de07a4ce30ce4f679c54b6b2af8",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TS07.mp3",
  associatedAudioSha256:
    "eba3e371fc9b1420fc3f12049b477c5226f9585c8d9d438c429edf4619492ee2",
  spriteObjectId: 462,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_247, y: 5_658}),
  rootPlacementPixels: Object.freeze({x: 412.35, y: 282.9}),
});

export const COURSE_G05_L04_TS_007_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ts-007",
  title: "Question 1 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TS_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ts-007/canvas-renderer.js",
  assetSha256:
    "9c43f6375d1566e519209de9bd6dfe1e298b3b984daad707749b8296acefbc91",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-462",
  mainFrameCount: 684,
  livePlaybackEndFrame: 263,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 264, lastFrame: 684, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "question-1-source-drawing",
      firstFrame: 1,
      lastFrame: 263,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Interaction-dependent frames 264..684, source controls, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TS_007_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
