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

import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

// Source placement intervals and bounds are retained; modern controls consolidate identical targets.
// These mappings do not establish original host lookup parity.
export const COURSE_G04_L03_TS_008_HELP_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "positive-number-f1",
    characterId: 166,
    keyAttribute: "Positive number",
    firstFrame: 1,
    lastFrame: 1,
    depth: 37,
    sourceBounds: Object.freeze({"left": 586.6896118164062, "right": 696.2244171142578, "top": 214.75, "bottom": 237.25}),
    entryIds: Object.freeze({"en": "en-0499-e54dca5d8b22", "es": "es-0458-9770130a5961"}),
    labels: Object.freeze({"en": "Positive number", "es": "Número positivo"}),
  }),
  Object.freeze({
    id: "owe-f1",
    characterId: 167,
    keyAttribute: "Owe",
    firstFrame: 1,
    lastFrame: 1,
    depth: 39,
    sourceBounds: Object.freeze({"left": 77.33453369140625, "right": 120.77119445800781, "top": 211.75, "bottom": 234.25}),
    entryIds: Object.freeze({"en": "en-0451-a7f0d0283926", "es": "es-0133-2ce224d0bb7f"}),
    labels: Object.freeze({"en": "Owe", "es": "Deber"}),
  }),
  Object.freeze({
    id: "negative-number-f1",
    characterId: 168,
    keyAttribute: "Negative number",
    firstFrame: 1,
    lastFrame: 1,
    depth: 41,
    sourceBounds: Object.freeze({"left": 213.7694580078125, "right": 333.5397521972656, "top": 214.75, "bottom": 237.25}),
    entryIds: Object.freeze({"en": "en-0411-1954bd66c84d", "es": "es-0456-9da6d6ebd619"}),
    labels: Object.freeze({"en": "Negative number", "es": "Número negativo"}),
  }),
]);
export const COURSE_G04_L03_TS_008_HELP_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-008",
  frameDomain: "sprite-169",
  terms: COURSE_G04_L03_TS_008_HELP_GLOSSARY_HOTSPOTS,
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);
