import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";

export const COURSE_G04_L03_TS_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS07.swf",
  swfSha256: "f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf",
  fla: null,
  flaSha256: null,
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS07.mp3",
  associatedAudioSha256: "6d57334f95e77ff124f4c9c7721cbaad50f9e7592ffc1a6b46b074f023049fd1",
  associatedAudioTechnicalDurationMs: 74_112,
  spriteObjectId: 441,
  mouseEventSignalCount: 34,
  replayOrResetSignalCount: 3,
  timelineNavigationOccurrenceCount: 87,
});

export const COURSE_G04_L03_TS_007_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-007",
  title: "Question 1 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ts-007/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-441",
  mainFrameCount: 696,
  livePlaybackEndFrame: 235,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [47, 1], [49, 1], [90, 70], [114, 97], [127, 20], [183, 83],
    [193, 28], [211, 27], [216, 1], [225, 31], [253, 28], [262, 22],
    [284, 26], [290, 22], [314, 19], [324, 27], [350, 31], [382, 25],
    [415, 27], [439, 70], [445, 1],
  ].map(([id, frameCount]) => Object.freeze({id: `sprite-${id}`, frameCount,
    label: "Statically reachable companion; runtime composition disabled"}))),
  visualMarkers: Object.freeze([Object.freeze({
    id: "test-question-1-source-static-drawing",
    firstFrame: 1,
    lastFrame: 696,
  })]),
  sourceControlBehaviorLabel: "Twenty-eight source buttons, thirty-four mouse-event signals, Replay/reset actions, eighty-seven timeline-navigation occurrences, all audio, and all ActionScript execution are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_007_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
