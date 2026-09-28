import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

export const COURSE_G04_L03_RW_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW02.swf",
  swfSha256:
    "8b2aa7afd7e82fc582b8e7b936d178c87fea16106b26061f872c81ea7d422785",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW02.mp3",
  associatedAudioSha256:
    "79d0b6504a0d8bb66e3a7a19a5156ab35a49271fdbaab40033c0dda5600a627e",
  embeddedAudioStreamSha256:
    "7616d349bf0b7e8122a3e82fb35da28fca538aa2907326ce5299b1e6b42ac46c",
  spriteObjectId: 421,
  companionSpriteObjectId: 425,
  buttonObjectIds: Object.freeze([377, 378, 379]),
  sourceButtonPlacementFrame: 1099,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 7_219, y: 5_460}),
  rootPlacementPixels: Object.freeze({x: 360.95, y: 273}),
});

// Source: sprite-421 frame 1099, DefineButton2 377–379. Native hit bounds
// remain audit metadata; the maintained adapter presents readable buttons.
export const COURSE_G04_L03_RW_002_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "negative-number",
    characterId: 377,
    keyAttribute: "Negative number",
    firstFrame: 1099,
    lastFrame: 1289,
    depth: 101,
    sourceBounds: Object.freeze({
      left: 189.5017242431641,
      right: 317.4922355651855,
      top: 367.3775390625,
      bottom: 382.5827606201172,
    }),
    entryIds: Object.freeze({en: "en-0411-1954bd66c84d", es: "es-0456-9da6d6ebd619"}),
    labels: Object.freeze({en: "Negative number", es: "Número negativo"}),
  }),
  Object.freeze({
    id: "less-than",
    characterId: 378,
    keyAttribute: "Less than",
    firstFrame: 1099,
    lastFrame: 1289,
    depth: 103,
    sourceBounds: Object.freeze({
      left: 345.66961975097655,
      right: 408.2785087585449,
      top: 367.0275390625,
      bottom: 382.2327606201172,
    }),
    entryIds: Object.freeze({en: "en-0344-ac5e44095a38", es: "es-0401-7b42de19e998"}),
    labels: Object.freeze({en: "Less than", es: "Menor que"}),
  }),
  Object.freeze({
    id: "zero",
    characterId: 379,
    keyAttribute: "Zero",
    firstFrame: 1099,
    lastFrame: 1289,
    depth: 105,
    sourceBounds: Object.freeze({
      left: 410.7820556640625,
      right: 442.7914245605469,
      top: 367.0275390625,
      bottom: 382.2327606201172,
    }),
    entryIds: Object.freeze({en: "en-0760-6575e63919df", es: "es-0057-e01a19219cce"}),
    labels: Object.freeze({en: "Zero", es: "Cero"}),
  }),
] as const);

export const COURSE_G04_L03_RW_002_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-rw-002",
  frameDomain: "sprite-421",
  terms: COURSE_G04_L03_RW_002_GLOSSARY_HOTSPOTS,
  learnerPrompt: "Negative numbers are less than zero.",
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_RW_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-rw-002",
  title: "Page 1 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_RW_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-rw-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-421",
  mainFrameCount: 1289,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-425", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-numbers-number-line", firstFrame: 1, lastFrame: 1289}),
  ]),
  sourceControlBehaviorLabel:
    "Three source buttons, seven timeline-navigation signals, and their ActionScript behavior are disabled; byte-identical embedded and associated audio candidates are restored while synchronization and listening acceptance remain pending",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_RW_002_AUTHORITY = Object.freeze({
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
