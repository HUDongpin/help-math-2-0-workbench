import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_RW_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf",
  swfSha256:
    "eaea3b8e3efe6ec9e095bb09980476577686d09c94b29439dfb07015c7abb81c",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4RW02.mp3",
  associatedAudioSha256:
    "b5e7f4cc6d36842db58edc63d96681c8eab31ccd3e109384b8194368809157de",
  spriteObjectId: 341,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "Animation",
  rootPlacementTwips: Object.freeze({x: 7_219, y: 5_460}),
  rootPlacementPixels: Object.freeze({x: 360.95, y: 273}),
});

export const COURSE_G05_L04_RW_002_CONFIG = Object.freeze({
  animationId: "course-g05-l04-rw-002",
  title:
    "Number Lines: Real World — Page 1 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_RW_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-rw-002/canvas-renderer.js",
  assetSha256:
    "5bd9d7d4c99901ea866a90a9ab98c609f1856d3136fd63778a9270bcc888d24f",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-341",
  mainFrameCount: 419,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "real-world-page-1-source-drawing",
      firstFrame: 1,
      lastFrame: 419,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Root host entry, associated audio, Spanish visuals, work-study labor evidence, terminal behavior, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_RW_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
