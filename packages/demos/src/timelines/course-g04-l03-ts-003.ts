import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TS_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS03.swf",
  swfSha256:
    "1ff4291c2d5009ad33b877bd03d5c31bf1842e0b8b0ff7acb74ae559b833ce44",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS03.mp3",
  associatedAudioSha256:
    "33b5c3c7e630cac092c25718e17a322c90a4a76f3aa31aa1167026847b14eb0a",
  embeddedAudioStreamSha256:
    "f8419e0465dbb60235084af4229a2c6dfca15b0674e5dba5e1b42e6cc28f1aa5",
  spriteObjectId: 25,
  companionSpriteObjectId: 3,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_TS_003_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-003",
  title: "4 - Step Plan — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TS_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-ts-003/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-25",
  mainFrameCount: 241,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-3", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan", firstFrame: 1, lastFrame: 241}),
  ]),
  sourceControlBehaviorLabel:
    "Both source buttons, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_003_AUTHORITY = Object.freeze({
  implementationAuthorized: false,
  registryIsPrototypeOnly: true,
  productRouteMayBeAdded: false,
  strictLedgerMayBeChanged: false,
  publicStrictLibraryAdmission: false,
  legacyActionScriptExecuted: false,
  sourcePointerEventsEnabled: false,
  embeddedAudioRendered: false,
  associatedAudioRendered: false,
  spanishVisualRuntimeEstablished: false,
  rootCompositionEstablished: false,
  companionCompositionEstablished: false,
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

// Source placement intervals and bounds are retained; modern controls consolidate identical targets.
// Title case is normalized; strategies uses the explicit modern Strategy inflection alias.
// These mappings do not establish original host lookup parity.
export const COURSE_G04_L03_TS_003_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "organize-f24",
    characterId: 17,
    keyAttribute: "Organize",
    firstFrame: 24,
    lastFrame: 241,
    depth: 16,
    sourceBounds: Object.freeze({"left": 231.82905349731445, "right": 323.8285308837891, "top": 78.25002441406251, "bottom": 103.6499755859375}),
    entryIds: Object.freeze({"en": "en-0442-5722e95ef2b8", "es": "es-0471-571517014d23"}),
    labels: Object.freeze({"en": "Organize", "es": "Organizar"}),
  }),
  Object.freeze({
    id: "information-f24",
    characterId: 18,
    keyAttribute: "Information",
    firstFrame: 24,
    lastFrame: 241,
    depth: 18,
    sourceBounds: Object.freeze({"left": 363.9, "right": 472.35, "top": 80.25, "bottom": 102.65}),
    entryIds: Object.freeze({"en": "en-0301-ce7f6e5c58b3", "es": "es-0342-21dc5fcdcc72"}),
    labels: Object.freeze({"en": "Information", "es": "Información"}),
  }),
]);
export const COURSE_G04_L03_TS_003_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-003",
  frameDomain: "sprite-25",
  terms: COURSE_G04_L03_TS_003_GLOSSARY_HOTSPOTS,
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);
