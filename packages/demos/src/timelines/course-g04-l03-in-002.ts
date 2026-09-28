import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN02.swf",
  swfSha256:
    "60a1a78e5e927d6732c69518699caf71307e4f30da3b9e2bab29d0bab241989d",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN02.mp3",
  associatedAudioSha256:
    "65fbaef6b2a96b18da2bed86118a754d64c075af251bd5f0074ed16f5c40aafa",
  embeddedAudioStreamSha256:
    "ae955baab49711089ae10e2425bcce1e1327cadcd0f7f0d65039fe23ebb05263",
  spriteObjectId: 88,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

// Source-locked glossary placements; geometry remains audit metadata.
export const COURSE_G04_L03_IN_002_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "number-line",
    characterId: 10,
    keyAttribute: "Number line",
    firstFrame: 3,
    lastFrame: 492,
    depth: 4,
    sourceBounds: Object.freeze({left: 185.5, right: 283.17710876464844, top: 85.9, bottom: 104.47767486572266}),
    entryIds: Object.freeze({en: "en-0424-79116d5cfb19", es: "es-0571-2c68dc77903f"}),
    labels: Object.freeze({en: "Number line", es: "Recta numérica"}),
  }),
  Object.freeze({
    id: "line",
    characterId: 11,
    keyAttribute: "Line",
    firstFrame: 3,
    lastFrame: 492,
    depth: 6,
    sourceBounds: Object.freeze({left: 323.5, right: 353.1663131713867, top: 85.4, bottom: 103.97767486572266}),
    entryIds: Object.freeze({en: "en-0348-26540cbc2a59", es: "es-0382-cd0a6592bc4a"}),
    labels: Object.freeze({en: "Line", es: "Línea"}),
  }),
  Object.freeze({
    id: "order",
    characterId: 12,
    keyAttribute: "Order",
    firstFrame: 3,
    lastFrame: 492,
    depth: 8,
    sourceBounds: Object.freeze({left: 389.0, right: 459.6937942504883, top: 85.9, bottom: 104.47767486572266}),
    entryIds: Object.freeze({en: "en-0438-85eefb739783", es: "es-0468-0de078d08617"}),
    labels: Object.freeze({en: "Order", es: "Ordenar"}),
  }),
  Object.freeze({
    id: "value",
    characterId: 13,
    keyAttribute: "Value",
    firstFrame: 3,
    lastFrame: 492,
    depth: 10,
    sourceBounds: Object.freeze({left: 613.5, right: 663.2066116333008, top: 85.9, bottom: 104.47767486572266}),
    entryIds: Object.freeze({en: "en-0737-920ae135dd07", es: "es-0714-a437c574a1bc"}),
    labels: Object.freeze({en: "Value", es: "Valor"}),
  }),
  Object.freeze({
    id: "positive-number",
    characterId: 76,
    keyAttribute: "Positive number",
    firstFrame: 93,
    lastFrame: 492,
    depth: 86,
    sourceBounds: Object.freeze({left: 495.5, right: 651.162467956543, top: 209.4, bottom: 227.97767486572266}),
    entryIds: Object.freeze({en: "en-0499-e54dca5d8b22", es: "es-0458-9770130a5961"}),
    labels: Object.freeze({en: "Positive number", es: "Número positivo"}),
  }),
  Object.freeze({
    id: "negative-number",
    characterId: 80,
    keyAttribute: "Negative number",
    firstFrame: 237,
    lastFrame: 492,
    depth: 123,
    sourceBounds: Object.freeze({left: 175.5, right: 331.16246795654297, top: 209.4, bottom: 227.97767486572266}),
    entryIds: Object.freeze({en: "en-0411-1954bd66c84d", es: "es-0456-9da6d6ebd619"}),
    labels: Object.freeze({en: "Negative number", es: "Número negativo"}),
  }),
] as const);

export const COURSE_G04_L03_IN_002_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-002",
  frameDomain: "sprite-88",
  terms: COURSE_G04_L03_IN_002_GLOSSARY_HOTSPOTS,
  learnerPrompt: "Numbers increase from left to right. Negative numbers are left of zero; positive numbers are right of zero.",
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_IN_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-002",
  title:
    "Numbers on the Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-88",
  mainFrameCount: 492,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "page-title"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "numbers-on-number-line", firstFrame: 1, lastFrame: 492}),
  ]),
  sourceControlBehaviorLabel:
    "All six source buttons, nine timeline-navigation signals, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_002_AUTHORITY = Object.freeze({
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
