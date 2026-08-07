import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_TS_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS03.swf",
  swfSha256:
    "459a17c28b3f2ad99e4cfec68bbe91a6b876cf5b94983f76316b16ef301300a3",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS03.fla",
  flaSha256:
    "b24a774b4d2a7d76b25356b750dbd5b2c6dce5e1a055068af50d04367bc3b0e4",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TS03.mp3",
  associatedAudioSha256:
    "33b5c3c7e630cac092c25718e17a322c90a4a76f3aa31aa1167026847b14eb0a",
  spriteObjectId: 25,
  rootPreloaderStopFrame: null,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction:
    '_level0.InternalPreloader.gotoAndPlay("jump_check");',
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_TS_003_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ts-003",
  title:
    "Number Lines: 4 Step Plan, Page 3 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TS_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ts-003/canvas-renderer.js",
  assetSha256:
    "300fd5adb8b179a3cdd9aab70ea1b1fd863321402044ad82f2888107023fa08f",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-25",
  mainFrameCount: 227,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan-page-3-source-drawing", firstFrame: 1, lastFrame: 227}),
  ]),
  sourceControlBehaviorLabel:
    "Root frame 1 preloader navigation is not rendered; two source buttons, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TS_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
