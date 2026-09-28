import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_VB_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB04.swf",
  swfSha256:
    "13bff9e32e20d8fdd7a3b1df03e585d8f0bffbe03f74fca20db99350d7c0ea47",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB04.fla",
  flaSha256:
    "51541729c19ba3faa57819ede17ad138686d26a0d8c3f5171487cf7cd4317d05",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB04.mp3",
  associatedAudioSha256:
    "2dc923614099d5290a2b6c62c69bdd4c1037b290635bd834890e2cdd16c1f4df",
  embeddedAudioStreamSha256:
    "0b42bb5e9c225e42b6aec24ee47d21829e9acde5af07073669a8aeb3bc077313",
  spriteObjectId: 53,
  companionSpriteObjectId: 5,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

// Source-locked glossary placements; geometry remains audit metadata.
export const COURSE_G04_L03_VB_004_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "positive-number",
    characterId: 11,
    keyAttribute: "Positive number",
    firstFrame: 1,
    lastFrame: 245,
    depth: 5,
    sourceBounds: Object.freeze({left: 78.73060302734375, right: 241.9341827392578, top: 119.41440429687499, bottom: 141.92681655883788}),
    entryIds: Object.freeze({en: "en-0499-e54dca5d8b22", es: "es-0458-9770130a5961"}),
    labels: Object.freeze({en: "Positive number", es: "Número positivo"}),
  }),
  Object.freeze({
    id: "greater-than",
    characterId: 12,
    keyAttribute: "Greater than",
    firstFrame: 1,
    lastFrame: 245,
    depth: 7,
    sourceBounds: Object.freeze({left: 280.13825073242185, right: 400.9616470336914, top: 119.41440429687499, bottom: 141.92681655883788}),
    entryIds: Object.freeze({en: "en-0258-b63a4f18372f", es: "es-0391-a2bbe065c7a3"}),
    labels: Object.freeze({en: "Greater than", es: "Mayor que"}),
  }),
  Object.freeze({
    id: "zero",
    characterId: 13,
    keyAttribute: "Zero",
    firstFrame: 1,
    lastFrame: 245,
    depth: 9,
    sourceBounds: Object.freeze({left: 405.4250549316406, right: 446.74071502685547, top: 119.41440429687499, bottom: 141.92681655883788}),
    entryIds: Object.freeze({en: "en-0760-6575e63919df", es: "es-0057-e01a19219cce"}),
    labels: Object.freeze({en: "Zero", es: "Cero"}),
  }),
] as const);

export const COURSE_G04_L03_VB_004_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-004",
  frameDomain: "sprite-53",
  terms: COURSE_G04_L03_VB_004_GLOSSARY_HOTSPOTS,
  learnerPrompt: "Positive numbers are greater than zero.",
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_VB_004_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-004",
  title: "Positive Numbers — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_VB_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-53",
  mainFrameCount: 245,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "positive-numbers", firstFrame: 1, lastFrame: 245}),
  ]),
  sourceControlBehaviorLabel:
    "All three source buttons, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_VB_004_AUTHORITY = Object.freeze({
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
  maskMorphRuntimeParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
