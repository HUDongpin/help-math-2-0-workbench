import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";

export const COURSE_G04_L03_IR_001_341242CC_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IR/L3RW01.swf",
  swfSha256: "2af6431db3ed786d9b48feec5a649887af92fb219a04e5dbd42e7e4b04087df4",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IR/L3RW01.fla",
  flaSha256: "3f5fe69773dea4516f1804cbd0e77396450c60d989691b87563d480d4179809c",
  spriteObjectId: 27,
  mutedVisualFrameRange: Object.freeze({firstFrame: 1, lastFrame: 136}),
  randomCall: Object.freeze({
    path: "DefineSprite_27/frame_1/DoAction.as",
    sha256: "4ddb20c356143adcb0e9e397770d1ae5fbd2482b4f4abdf6744bc952c0432809",
    disposition: "audio-branch-inventoried-not-executed-visual-static",
  }),
});

export const COURSE_G04_L03_IR_001_341242CC_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ir-001-341242cc",
  title: "Introduction — source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IR_001_341242CC_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ir-001-341242cc/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-27",
  mainFrameCount: 136,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-9", frameCount: 135, label: "Random audio stream A; visual marker static"}),
    Object.freeze({id: "sprite-10", frameCount: 135, label: "Random audio stream B; visual marker static"}),
  ]),
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "introduction-muted-source-static-drawing",
    firstFrame: 1,
    lastFrame: 136,
  })]),
  sourceControlBehaviorLabel: "The source random(2) branch is represented by a deterministic seed-bound engineering audio candidate; natural random behavior, authoritative runtime synchronization, host behavior, and all ActionScript execution remain unverified",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IR_001_341242CC_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
