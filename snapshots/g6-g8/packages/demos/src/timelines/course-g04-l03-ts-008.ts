import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";

export const COURSE_G04_L03_TS_008_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf",
  swfSha256: "9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885",
  fla: null,
  flaSha256: null,
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS08.mp3",
  associatedAudioSha256: "1f1b05f78d571ed7c756013377bee1a86d0e893b45c6bf381bf9340ae22a764c",
  associatedAudioTechnicalDurationMs: 12_984,
  spriteObjectId: 350,
  mouseEventSignalCount: 30,
  replayOrResetSignalCount: 2,
  timelineNavigationOccurrenceCount: 81,
});

export const COURSE_G04_L03_TS_008_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-008",
  title: "Question 2 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TS_008_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-350",
  mainFrameCount: 789,
  livePlaybackEndFrame: 328,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [48, 1], [50, 1], [91, 70], [142, 21], [153, 20], [169, 1],
    [197, 28], [208, 28], [220, 29], [232, 31], [260, 28], [284, 27],
    [290, 1], [297, 1], [300, 28], [312, 25], [324, 28], [348, 70], [354, 1],
  ].map(([id, frameCount]) => Object.freeze({id: `sprite-${id}`, frameCount,
    label: "Statically reachable companion; runtime composition disabled"}))),
  visualMarkers: Object.freeze([Object.freeze({
    id: "test-question-2-source-static-drawing",
    firstFrame: 1,
    lastFrame: 789,
  })]),
  sourceControlBehaviorLabel: "Twenty-four source buttons, thirty mouse-event signals, Replay/reset actions, eighty-one timeline-navigation occurrences, all audio, and all ActionScript execution are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_008_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
