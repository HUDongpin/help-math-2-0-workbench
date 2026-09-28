import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN07.swf",
  swfSha256:
    "91c013434558ec9d6b49df67ae29106073b1a98de19099fdda26ab8d5f2d8d45",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN07.mp3",
  associatedAudioSha256:
    "96447525dc60534210a1752626bb9a627df2ce815339fded5ae2e13447fc10aa",
  embeddedAudioStreamSha256:
    "35e62bb8ad052e76e20331722668f979a15588e6dbe39623a41291e0848fcaad",
  spriteObjectId: 98,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});


// Source-locked glossary placements; geometry remains audit metadata.
export const COURSE_G04_L03_IN_007_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "pattern",
    characterId: 10,
    keyAttribute: "Pattern",
    firstFrame: 15,
    lastFrame: 555,
    depth: 4,
    sourceBounds: Object.freeze({"left": 75.53574817134069, "right": 145.24864173501265, "top": 92.65589848448289, "bottom": 111.23357110042124}),
    entryIds: Object.freeze({"en": "en-0459-b510b9647e1c", "es": "es-0481-73e819571a77"}),
    labels: Object.freeze({"en": "Pattern", "es": "Patrón"}),
  }),
  Object.freeze({
    id: "symbol",
    characterId: 11,
    keyAttribute: "Symbol",
    firstFrame: 15,
    lastFrame: 555,
    depth: 6,
    sourceBounds: Object.freeze({"left": 411.0390805068426, "right": 487.25039738703055, "top": 91.15589848448289, "bottom": 109.73357110042124}),
    entryIds: Object.freeze({"en": "en-0677-bff39ce92c9e", "es": "es-0655-871afa316e73"}),
    labels: Object.freeze({"en": "Symbol", "es": "Símbolo"}),
  }),
  Object.freeze({
    id: "set",
    characterId: 12,
    keyAttribute: "Set",
    firstFrame: 15,
    lastFrame: 555,
    depth: 8,
    sourceBounds: Object.freeze({"left": 187.01484663914889, "right": 215.96743738572113, "top": 91.15589848448289, "bottom": 109.73357110042124}),
    entryIds: Object.freeze({"en": "en-0612-bf9e68924be1", "es": "es-0083-7cd0c12afef8"}),
    labels: Object.freeze({"en": "Set", "es": "Conjunto"}),
  }),
  Object.freeze({
    id: "rule",
    characterId: 15,
    keyAttribute: "Rule",
    firstFrame: 83,
    lastFrame: 555,
    depth: 14,
    sourceBounds: Object.freeze({"left": 192.76845798380674, "right": 228.76357080386953, "top": 123.15589848448289, "bottom": 141.73357110042124}),
    entryIds: Object.freeze({"en": "en-0594-2fc559859c42", "es": "es-0581-1e43802cd308"}),
    labels: Object.freeze({"en": "Rule", "es": "Regla"}),
  }),
] as const);

export const COURSE_G04_L03_IN_007_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-007",
  frameDomain: "sprite-98",
  terms: COURSE_G04_L03_IN_007_GLOSSARY_HOTSPOTS,
  learnerPrompt: "A pattern follows a rule. This number pattern decreases by 3 each time.",
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_IN_007_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-007",
  title: "Patterns — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-007/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-98",
  mainFrameCount: 555,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "page-title"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-number-patterns", firstFrame: 1, lastFrame: 555}),
  ]),
  sourceControlBehaviorLabel:
    "All four source buttons, seven timeline-navigation signals, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_007_AUTHORITY = Object.freeze({
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
