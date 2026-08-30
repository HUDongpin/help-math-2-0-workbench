import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_RW_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/RW/L4RW04.swf",
  swfSha256:
    "76f8be5ed2e8bf8116720cf3e934a59d7368747471a356183cfd1d09f4cd0283",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4RW04.mp3",
  associatedAudioSha256:
    "e60d1458f8f4039c8f0baeddfb08f1d6be53d59cf94826490116119132b90498",
  spriteObjectId: 227,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "Animation",
  rootPlacementTwips: Object.freeze({x: 7_219, y: 5_460}),
  rootPlacementPixels: Object.freeze({x: 360.95, y: 273}),
});

export const COURSE_G05_L04_RW_004_CONFIG = Object.freeze({
  animationId: "course-g05-l04-rw-004",
  title:
    "Number Lines: Your World — Page 3 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_RW_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-rw-004/canvas-renderer.js",
  assetSha256:
    "0c15179758a7341599ba528a0240dce9fac26955bda8b824143804dc3e1b43bc",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-227",
  mainFrameCount: 506,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "your-world-page-3-source-drawing",
      firstFrame: 1,
      lastFrame: 506,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Five source buttons, host vocabulary callbacks, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_RW_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
