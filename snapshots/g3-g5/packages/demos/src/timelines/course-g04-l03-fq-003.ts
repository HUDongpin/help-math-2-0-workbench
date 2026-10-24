import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";

export const COURSE_G04_L03_FQ_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/L3FQ03.swf",
  swfSha256: "f40e24b47e05de7dce02ac98344c8748b5941a67d908f85fc1fe152fe684b7dc",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/L3FQ03.fla",
  flaSha256: "a873da8016d59b001db1fc5be359063342861809a33af194fec9fec81082a2f4",
  sharedAudioGroupId: "course-g04-l03-fq-audio",
  sharedAudioFileCount: 108,
  spriteObjectId: 899,
  externalControlEvent: Object.freeze({
    path: "DefineButton2_12/BUTTONCONDACTION on(release).as",
    sha256: "f96cd6ef551caebcc7af4898e4e1985ba6366a3129a4498197777c5c3fefac05",
    disposition: "inventoried-disabled-never-executed",
  }),
});

export const COURSE_G04_L03_FQ_003_CONFIG = Object.freeze({
  animationId: "course-g04-l03-fq-003",
  title: "Final Quiz Page 2 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_FQ_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-fq-003/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-899",
  mainFrameCount: 68,
  livePlaybackEndFrame: 43,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-16", frameCount: 2, label: "Nested quiz control timeline; unavailable"}),
    Object.freeze({id: "sprite-64", frameCount: 2, label: "Nested quiz control timeline; unavailable"}),
    Object.freeze({id: "sprite-65", frameCount: 8, label: "Nested quiz control timeline; unavailable"}),
  ]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "final-quiz-page-2-source-static-drawing",
    firstFrame: 1,
    lastFrame: 68,
  })]),
  sourceControlBehaviorLabel: "The getURL source call is confined to a disabled button event; 108 shared audio files, 259 edit-text definitions, scoring, pointer controls, and all ActionScript execution remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_FQ_003_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
