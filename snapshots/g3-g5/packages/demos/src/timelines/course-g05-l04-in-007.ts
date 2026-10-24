import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_IN_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN07.swf",
  swfSha256:
    "6aea8f9b942cd6e805b31b5e1837f4815fa543612e7cec0acdad687fe555c89b",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN07.mp3",
  associatedAudioSha256:
    "e0b5f36cbcf426f550ac68707d29ee0c96eb901dde943d977239153ca18fde42",
  spriteObjectId: 76,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_606}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 280.3}),
});

export const COURSE_G05_L04_IN_007_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-007",
  title:
    "Number Lines: Learn It — Represent Fractions and Mixed Numbers on a Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-007/canvas-renderer.js",
  assetSha256:
    "c21d71816db07a291baf9b00190545e39da2c917d47af29f08e461bc03d10358",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-76",
  mainFrameCount: 654,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "fractions-mixed-number-line-page-7-source-drawing",
      firstFrame: 1,
      lastFrame: 654,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Four source buttons, host vocabulary callbacks, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_007_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
