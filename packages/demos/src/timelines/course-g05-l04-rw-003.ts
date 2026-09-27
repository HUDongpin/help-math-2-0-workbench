import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_RW_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/RW/L4RW03.swf",
  swfSha256:
    "b301a8789c03e68a7b00d4a288f874a8febfb309668c34b298a13546b8d44154",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4RW03.mp3",
  associatedAudioSha256:
    "c3efa2fa42b6bf07795b712e3641fe7058a7c57efe630d201e5ef7316c1a8a81",
  spriteObjectId: 535,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "Animation",
  rootPlacementTwips: Object.freeze({x: 7_219, y: 5_460}),
  rootPlacementPixels: Object.freeze({x: 360.95, y: 273}),
});

export const COURSE_G05_L04_RW_003_CONFIG = Object.freeze({
  animationId: "course-g05-l04-rw-003",
  title:
    "Number Lines: Your World — Page 2 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_RW_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-rw-003/canvas-renderer.js",
  assetSha256:
    "1639cf7eeeeda00cbbce347488cec545fddc46e81cffa0b671d625dc781432a3",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-535",
  mainFrameCount: 1141,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "your-world-page-2-source-drawing",
      firstFrame: 1,
      lastFrame: 1141,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Three source buttons, host vocabulary callbacks, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_RW_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
