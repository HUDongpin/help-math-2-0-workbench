import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_VB_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB02.swf",
  swfSha256:
    "0e378f21899cd615107a08a085b4f37b96066e49e409eb9793219f7c953eb4f3",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB02.fla",
  flaSha256:
    "e47d05e8ebbd23f9b573ebee9041fca72277a015d76180aae0eefd7a8da65dd0",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB02.mp3",
  associatedAudioSha256:
    "a611b160a2dec23c7e2368a72661a03f8b291e586d5148d048d48f16c8daa610",
  embeddedAudioSha256:
    "4b00a2b44e86ef46ff876850a09073f12790bb107e92b8072840fc0ebacee78f",
  spriteObjectId: 52,
  companionSpriteObjectId: 5,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

// Source-locked glossary placements; geometry remains audit metadata.
export const COURSE_G04_L03_VB_002_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "number-line",
    characterId: 11,
    keyAttribute: "Number line",
    firstFrame: 1,
    lastFrame: 193,
    depth: 59,
    sourceBounds: Object.freeze({left: 98.19298400878908, right: 212.11263351440428, top: 119.41440429687499, bottom: 141.92681655883788}),
    entryIds: Object.freeze({en: "en-0424-79116d5cfb19", es: "es-0571-2c68dc77903f"}),
    labels: Object.freeze({en: "Number line", es: "Recta numérica"}),
  }),
  Object.freeze({
    id: "line",
    characterId: 12,
    keyAttribute: "Line",
    firstFrame: 1,
    lastFrame: 193,
    depth: 61,
    sourceBounds: Object.freeze({left: 251.65653076171876, right: 287.01417541503906, top: 119.41440429687499, bottom: 141.92681655883788}),
    entryIds: Object.freeze({en: "en-0348-26540cbc2a59", es: "es-0382-cd0a6592bc4a"}),
    labels: Object.freeze({en: "Line", es: "Línea"}),
  }),
  Object.freeze({
    id: "order",
    characterId: 13,
    keyAttribute: "Order",
    firstFrame: 1,
    lastFrame: 193,
    depth: 63,
    sourceBounds: Object.freeze({left: 321.37017211914065, right: 405.0604904174805, top: 119.41440429687499, bottom: 141.92681655883788}),
    entryIds: Object.freeze({en: "en-0438-85eefb739783", es: "es-0468-0de078d08617"}),
    labels: Object.freeze({en: "Order", es: "Ordenar"}),
  }),
  Object.freeze({
    id: "value",
    characterId: 14,
    keyAttribute: "Value",
    firstFrame: 1,
    lastFrame: 193,
    depth: 65,
    sourceBounds: Object.freeze({left: 571.5701568603515, right: 624.0863334655762, top: 119.41440429687499, bottom: 141.92681655883788}),
    entryIds: Object.freeze({en: "en-0737-920ae135dd07", es: "es-0714-a437c574a1bc"}),
    labels: Object.freeze({en: "Value", es: "Valor"}),
  }),
  Object.freeze({
    id: "positive-number",
    characterId: 47,
    keyAttribute: "Positive number",
    firstFrame: 124,
    lastFrame: 193,
    depth: 72,
    sourceBounds: Object.freeze({left: 475.3126159667969, right: 637.5529678344726, top: 336.414404296875, bottom: 358.9268165588379}),
    entryIds: Object.freeze({en: "en-0499-e54dca5d8b22", es: "es-0458-9770130a5961"}),
    labels: Object.freeze({en: "Positive number", es: "Número positivo"}),
  }),
  Object.freeze({
    id: "negative-number",
    characterId: 51,
    keyAttribute: "Negative number",
    firstFrame: 177,
    lastFrame: 193,
    depth: 76,
    sourceBounds: Object.freeze({left: 179.47935791015624, right: 351.6779754638672, top: 336.414404296875, bottom: 358.9268165588379}),
    entryIds: Object.freeze({en: "en-0411-1954bd66c84d", es: "es-0456-9da6d6ebd619"}),
    labels: Object.freeze({en: "Negative number", es: "Número negativo"}),
  }),
] as const);

export const COURSE_G04_L03_VB_002_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-002",
  frameDomain: "sprite-52",
  terms: COURSE_G04_L03_VB_002_GLOSSARY_HOTSPOTS,
  learnerPrompt: "A number line orders numbers by their value. Values increase to the right and decrease to the left.",
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_VB_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-002",
  title: "Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_VB_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-52",
  mainFrameCount: 193,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "number-line", firstFrame: 1, lastFrame: 193}),
  ]),
  sourceControlBehaviorLabel:
    "All six source buttons, embedded stream audio, the associated Spanish audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_VB_002_AUTHORITY = Object.freeze({
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
