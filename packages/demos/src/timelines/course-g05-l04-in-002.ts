import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_IN_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN02.swf",
  swfSha256:
    "fbdbdb943d534423c662f41bcec16cc3d68cb59ba4703782429a59ef69086a4f",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN02.mp3",
  associatedAudioSha256:
    "b2a68c00ad91a07b966ca121ce55304befbed782acdb438766b6bb17f03183cf",
  spriteObjectId: 52,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_IN_002_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-002",
  title:
    "Number Lines: Learn It — Introduction to Number Lines — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-002/canvas-renderer.js",
  assetSha256:
    "e3054dcaca2f83a16d24992490e3873c379c0e0627ebb089aea089cd27f335b5",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-52",
  mainFrameCount: 765,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "introduction-number-lines-source-drawing",
      firstFrame: 1,
      lastFrame: 765,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Eight source buttons, host vocabulary callbacks, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
