import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_TS_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS04.swf",
  swfSha256:
    "dcc40f586647f8f8ff05f533fc82e707af43ecb16e8c2bd5274a5165ea9666df",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS04.fla",
  flaSha256:
    "b3d0e23338ef6353411088b8cf625f2a60383254a7a104b80e8dde227f41a997",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TS04.mp3",
  associatedAudioSha256:
    "a2505e6988cca2f44777711d87175b385564a51c2cb5284c05d6246635cf5dbf",
  spriteObjectId: 36,
  rootPreloaderStopFrame: null,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction:
    '_level0.InternalPreloader.gotoAndPlay("jump_check");',
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 7_430, y: 5_667}),
  rootPlacementPixels: Object.freeze({x: 371.5, y: 283.35}),
});

export const COURSE_G05_L04_TS_004_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ts-004",
  title:
    "Number Lines: 4 Step Plan, Page 4 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TS_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ts-004/canvas-renderer.js",
  assetSha256:
    "798dac2092935f6a59885df7070f423d4246987f920e57887ddc61b422424446",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-36",
  mainFrameCount: 290,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan-page-4-source-drawing", firstFrame: 1, lastFrame: 290}),
  ]),
  sourceControlBehaviorLabel:
    "Root frame 1 preloader navigation is not rendered; seven source buttons, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TS_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
