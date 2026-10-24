import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 273..695 begin the first stop- and release-handler-controlled interaction and include later staged interactions whose progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TS_008_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS08.swf",
  swfSha256:
    "6fa625a826863ce02d91e061fcbcca062798e3cb0ce2cb07c7cd63012a779c64",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS08.fla",
  flaSha256:
    "782fa68ae307b9c0fd23f4823723c0086df803888e62fdd26888688bccb6fcf4",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TS08.mp3",
  associatedAudioSha256:
    "bd72ffe3d9f86ba495bf0d67e801f7f9f319da6e33bcf331f6e09db2746a3a63",
  spriteObjectId: 435,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_247, y: 5_658}),
  rootPlacementPixels: Object.freeze({x: 412.35, y: 282.9}),
});

export const COURSE_G05_L04_TS_008_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ts-008",
  title: "Question 2 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TS_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ts-008/canvas-renderer.js",
  assetSha256:
    "123c51a7ef0177203a3951baefc67dd6b8b7855c3aea3bd635217bba8e1fb384",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-435",
  mainFrameCount: 695,
  livePlaybackEndFrame: 272,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 273, lastFrame: 695, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "question-2-source-drawing",
      firstFrame: 1,
      lastFrame: 272,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Interaction-dependent frames 273..695, source controls, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TS_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
