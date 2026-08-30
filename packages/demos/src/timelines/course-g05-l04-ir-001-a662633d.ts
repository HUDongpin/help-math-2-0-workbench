import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_IR_001_A662633D_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf",
  swfSha256:
    "14b8f7639027b324e9411c5d1e753432ed81c1fb3c23e211291c4b53f36c52dd",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IR/L4RW01.fla",
  flaSha256:
    "80a7d4b83bfd3566660c7fd9a9b4586edddffd17c473e2fcc2b1a43660a3f4c5",
  embeddedAudioContainer:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf",
  embeddedAudioStreams: Object.freeze([
    Object.freeze({spriteObjectId: 30, frameCount: 135}),
    Object.freeze({spriteObjectId: 31, frameCount: 135}),
  ]),
  spriteObjectId: 53,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  randomAudioSelection: Object.freeze({
    selectionFrame: 1,
    playbackRequestFrame: 5,
    outcomes: 2,
    executedByCandidate: false,
  }),
});

export const COURSE_G05_L04_IR_001_A662633D_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ir-001-a662633d",
  title:
    "Number Lines: Introduction — muted English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IR_001_A662633D_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ir-001-a662633d/canvas-renderer.js",
  assetSha256:
    "90831653cd5023dc9353f64ae6859df42c8e91bda1cea069e9a9a4dd5c5f06b0",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-53",
  mainFrameCount: 136,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
    Object.freeze({
      id: "sprite-30",
      frameCount: 135,
      label: "Embedded random audio stream 0; not rendered",
    }),
    Object.freeze({
      id: "sprite-31",
      frameCount: 135,
      label: "Embedded random audio stream 1; not rendered",
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "introduction-muted-source-static-drawing",
      firstFrame: 1,
      lastFrame: 136,
    }),
  ]),
  sourceControlBehaviorLabel:
    "The source random(2) branch, both embedded audio streams, host entry, Spanish visuals, natural playback, and Replay remain disabled and unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IR_001_A662633D_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
