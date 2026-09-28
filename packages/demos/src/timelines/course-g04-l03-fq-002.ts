import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";

export const COURSE_G04_L03_FQ_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/L3FQ02.swf",
  swfSha256: "ab1940815259d7b73f9e9bf6e1f33351e00d3ec02e37286e480806409955882b",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/L3FQ02.fla",
  flaSha256: "146bbfa62ccb6cbd38d3a6f3f1bd4c5312a65821608bcdc0c081b43d3a6ebc77",
  sharedAudioGroupId: "course-g04-l03-fq-audio",
  sharedAudioFileCount: 108,
  spriteObjectId: 899,
  randomCall: Object.freeze({path: "DefineSprite_899/frame_1/DoAction.as",
    sha256: "818543cb14a259790afb733c553a6dd00b7a8b916c5d955efa0281e16dbf99f7"}),
  sourceLocalQuizContract: Object.freeze({
    questionLabels: 25,
    reviewLabels: 25,
    selectedWithoutReplacement: 10,
    questionFrames: Object.freeze({firstFrame: 2, lastFrame: 26}),
    reviewTransitionFrames: Object.freeze({firstFrame: 27, lastFrame: 43}),
    reviewFrames: Object.freeze({firstFrame: 44, lastFrame: 68}),
    sequentialPlaybackPermitted: false,
  }),
  externalApiCandidateCount: 1,
});

export const COURSE_G04_L03_FQ_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-fq-002",
  title: "Final Quiz Page 1 — source-static branch-atlas engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_FQ_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-fq-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-899",
  mainFrameCount: 68,
  livePlaybackEndFrame: 1,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-16", frameCount: 2, label: "Nested quiz control timeline; unavailable"}),
    Object.freeze({id: "sprite-64", frameCount: 2, label: "Nested quiz control timeline; unavailable"}),
    Object.freeze({id: "sprite-65", frameCount: 8, label: "Nested quiz control timeline; unavailable"}),
  ]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "final-quiz-page-1-source-static-branch-atlas-drawing",
    firstFrame: 1,
    lastFrame: 68,
  })]),
  sourceControlBehaviorLabel: "The source locally defines 25 paired question/review labels and randomly selects ten without replacement; frames 1–68 are inspectable only as a nonsequential static branch atlas with live playback capped at frame 1, while answer input, dynamic feedback, scoring, getURL behavior, 108 shared audio files, 259 edit-text definitions, and all ActionScript execution remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_FQ_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
