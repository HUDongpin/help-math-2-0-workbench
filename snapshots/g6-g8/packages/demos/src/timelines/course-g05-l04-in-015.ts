import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_IN_015_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN15.swf",
  swfSha256:
    "4c95da237ff9e40f388bb0efcb25f86312340511457eb6206e7b5df814eaca14",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN15.fla",
  flaSha256:
    "7aaa95c4e8406c9fc59096a8edac81de8bd74e4a140f743e07a950af3e36785d",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN15.mp3",
  associatedAudioSha256:
    "2fd86e7c12d0a205d9c69e47d014305248112b08aeca7e9d199f7ed6f5032968",
  spriteObjectId: 101,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_IN_015_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-015",
  title:
    "Numbers on the Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_015_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-015/canvas-renderer.js",
  assetSha256:
    "0cc1c8fd50905997c110f601e6ba657433a1161f518c06fb386db9daadb844e0",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-101",
  mainFrameCount: 601,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "signed-integers-number-line-source-drawing", firstFrame: 1, lastFrame: 601}),
  ]),
  sourceControlBehaviorLabel:
    "Root host entry, embedded audio, associated audio, Spanish visual path, terminal behavior, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_015_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
