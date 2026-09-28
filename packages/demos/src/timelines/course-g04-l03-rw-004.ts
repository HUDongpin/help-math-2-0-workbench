import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

export const COURSE_G04_L03_RW_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW04.swf",
  swfSha256:
    "506c062e33d447d5837de2094e2d881581f602d7f10458b6eae2864e3b234710",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW04.mp3",
  associatedAudioSha256:
    "e14afaa951ea01d6e1e26b2fd641676628f92b4772a77c5d54f1f3031c5e10dd",
  embeddedAudioStreamSha256:
    "c411aa9bba9224dc19df665638720a2e776b65d7f2d675631a00b11b4b2a3e7d",
  spriteObjectId: 121,
  nestedSpriteObjectId: 82,
  nestedSpritePlacementFrame: 204,
  companionSpriteObjectId: 125,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 7_219, y: 5_460}),
  rootPlacementPixels: Object.freeze({x: 360.95, y: 273}),
});

// Same-frame source replacements keep these glossary controls continuously
// present from their first placement through the final teaching frame.
export const COURSE_G04_L03_RW_004_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "represent",
    characterId: 114,
    keyAttribute: "Represent",
    firstFrame: 371,
    lastFrame: 442,
    depth: 127,
    sourceBounds: Object.freeze({
      left: 531.55,
      right: 643.5490921020508,
      top: 155.05,
      bottom: 176.54234771728517,
    }),
    entryIds: Object.freeze({en: "en-0574-48a09f6ed01d", es: "es-0597-e551e48f4e02"}),
    labels: Object.freeze({en: "Represent", es: "Representa"}),
  }),
  Object.freeze({
    id: "negative-number",
    characterId: 120,
    keyAttribute: "Negative number",
    firstFrame: 424,
    lastFrame: 442,
    depth: 133,
    sourceBounds: Object.freeze({
      left: 144.2,
      right: 317.3976089477539,
      top: 184.1,
      bottom: 205.59234771728515,
    }),
    entryIds: Object.freeze({en: "en-0411-1954bd66c84d", es: "es-0456-9da6d6ebd619"}),
    labels: Object.freeze({en: "Negative number", es: "Número negativo"}),
  }),
] as const);

export const COURSE_G04_L03_RW_004_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-rw-004",
  frameDomain: "sprite-121",
  terms: COURSE_G04_L03_RW_004_GLOSSARY_HOTSPOTS,
  learnerPrompt: "What situations are represented by negative numbers?",
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_RW_004_CONFIG = Object.freeze({
  animationId: "course-g04-l03-rw-004",
  title: "Page 3 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_RW_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-rw-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-121",
  mainFrameCount: 442,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-125", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-numbers-number-line", firstFrame: 1, lastFrame: 442}),
  ]),
  sourceControlBehaviorLabel:
    "Both source buttons, six timeline-navigation signals, the nested sprite-82 playhead, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_RW_004_AUTHORITY = Object.freeze({
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
  nestedSpriteNaturalPlayheadEstablished: false,
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
