import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 93..226 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_005_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN05.swf",
  swfSha256:
    "263d612f324947d701dbfd399721695498f7604df2201d73e26caf8a82c45a58",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN05.fla",
  flaSha256:
    "e6af1971d2d203edf5e48ecfcd217d02ff65a1c6c3e4e4b8c6c5eaf207bc9d63",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN05.mp3",
  associatedAudioSha256:
    "8414585482c2a5dab52f71ca3118e97abeccd4f9135678bddbb59815a695c23e",
  spriteObjectId: 222,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_606}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 280.3}),
});

export const COURSE_G05_L04_IN_005_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-005",
  title:
    "Represent Decimals on a Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-005/canvas-renderer.js",
  assetSha256:
    "a58891f4224f476432216ecdbd05fe8317eb6b2751b3603c3064370e4225b7da",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-222",
  mainFrameCount: 226,
  livePlaybackEndFrame: 92,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 93, lastFrame: 226, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "represent-decimals-page-5-source-drawing",
      firstFrame: 1,
      lastFrame: 92,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 93..226, source controls, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
