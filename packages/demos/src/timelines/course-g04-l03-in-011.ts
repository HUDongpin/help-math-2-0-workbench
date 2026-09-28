import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_011_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN11.swf",
  swfSha256:
    "a106b7a889b5da08377181e0e9d0e9ea2c59163103be0898fd5090f1a13fe1df",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN11.mp3",
  associatedAudioSha256:
    "d97d7e3b9cf9086c7dcfeadad8ecace32e5a66d545fec346c4b535423816913d",
  embeddedAudioStreamSha256:
    "0b1619190c83740dc5dbd120905eda3f4343a04706d8568c6943843de61228e0",
  spriteObjectId: 51,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

export const COURSE_G04_L03_IN_011_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-011",
  title:
    "Situations with Negative Numbers: Owing — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_011_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-011/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-51",
  mainFrameCount: 441,
  playbackMode: "once",
  companionDomains: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "owing-situation", firstFrame: 1, lastFrame: 441}),
  ]),
  sourceControlBehaviorLabel:
    "Both source buttons, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_011_AUTHORITY = Object.freeze({
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
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

// Source-locked glossary placements; geometry remains audit metadata.
export const COURSE_G04_L03_IN_011_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "positive",
    characterId: 48,
    keyAttribute: "Positive",
    firstFrame: 339,
    lastFrame: 441,
    depth: 51,
    sourceBounds: Object.freeze({"left": 489.15, "right": 546.6330780029297, "top": 323.75, "bottom": 339.44232177734375}),
    entryIds: Object.freeze({"en": "en-0496-498b59d01013", "es": "es-0516-f7f20d429054"}),
    labels: Object.freeze({"en": "Positive", "es": "Positivo"}),
  }),
  Object.freeze({
    id: "negative",
    characterId: 50,
    keyAttribute: "Negative",
    firstFrame: 345,
    lastFrame: 441,
    depth: 55,
    sourceBounds: Object.freeze({"left": 209.05, "right": 274.288395690918, "top": 322.55, "bottom": 338.24232177734376}),
    entryIds: Object.freeze({"en": "en-0408-196ea5a45df3", "es": "es-0439-b0dd8041f713"}),
    labels: Object.freeze({"en": "Negative", "es": "Negativo"}),
  }),
] as const);

export const COURSE_G04_L03_IN_011_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-011",
  frameDomain: "sprite-51",
  terms: COURSE_G04_L03_IN_011_GLOSSARY_HOTSPOTS,
  learnerPrompt: "Owing $5 is represented by −5. Having $2 is represented by +2. Negative numbers are left of zero; positive numbers are right of zero.",
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);
