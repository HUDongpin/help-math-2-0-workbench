import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

export const COURSE_G04_L03_VB_006_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB06.swf",
  swfSha256:
    "e83889619f1a162491b2d7bbc720be78c5ca1eda7f6348680a949e5a71e90168",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB06.fla",
  flaSha256:
    "44ce279b65a6ffb552dc8f0b4f10f9bdc05b5bfe874bf6de574ef2cce418f058",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB06.mp3",
  associatedAudioSha256:
    "5a56dbcee1dff83597b928d59e7e25223d0c10709616338a7a55152bf87a67bd",
  embeddedAudioSha256:
    "2af05bf5b607a7370fba0b722713349d4da6bf93efafb3be6eff68601964895f",
  spriteObjectId: 44,
  companionSpriteObjectId: 5,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

/**
 * Source-derived release geometry. The Canvas remains pointer-events:none;
 * a separate modern adapter may use these exact hit regions without executing
 * the legacy button or altering the source-static drawing.
 */
export const COURSE_G04_L03_VB_006_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "zero",
    characterId: 11,
    keyAttribute: "Zero",
    firstFrame: 1,
    lastFrame: 163,
    depth: 5,
    sourceBounds: Object.freeze({
      left: 194.5701,
      right: 240.0922,
      top: 119.4144,
      bottom: 141.9268,
    }),
    entryIds: Object.freeze({
      en: "en-0760-6575e63919df",
      es: "es-0057-e01a19219cce",
    }),
    labels: Object.freeze({en: "Zero", es: "Cero"}),
  }),
  Object.freeze({
    id: "value",
    characterId: 12,
    keyAttribute: "Value",
    firstFrame: 1,
    lastFrame: 163,
    depth: 7,
    sourceBounds: Object.freeze({
      left: 309.5446,
      right: 364.0103,
      top: 119.4144,
      bottom: 141.9268,
    }),
    entryIds: Object.freeze({
      en: "en-0737-920ae135dd07",
      es: "es-0714-a437c574a1bc",
    }),
    labels: Object.freeze({en: "Value", es: "Valor"}),
  }),
  Object.freeze({
    id: "positive-number",
    characterId: 42,
    keyAttribute: "Positive number",
    firstFrame: 116,
    lastFrame: 163,
    depth: 67,
    sourceBounds: Object.freeze({
      left: 350.8224,
      right: 428.5132,
      top: 342.5644,
      bottom: 365.0768,
    }),
    entryIds: Object.freeze({
      en: "en-0499-e54dca5d8b22",
      es: "es-0458-9770130a5961",
    }),
    labels: Object.freeze({en: "Positive number", es: "Número positivo"}),
  }),
  Object.freeze({
    id: "negative-number",
    characterId: 43,
    keyAttribute: "Negative number",
    firstFrame: 116,
    lastFrame: 163,
    depth: 69,
    sourceBounds: Object.freeze({
      left: 454.7472,
      right: 540.4818,
      top: 343.5644,
      bottom: 366.0768,
    }),
    entryIds: Object.freeze({
      en: "en-0411-1954bd66c84d",
      es: "es-0456-9da6d6ebd619",
    }),
    labels: Object.freeze({en: "Negative number", es: "Número negativo"}),
  }),
] as const);

export const COURSE_G04_L03_VB_006_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-006",
  frameDomain: "sprite-44",
  terms: COURSE_G04_L03_VB_006_GLOSSARY_HOTSPOTS,
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_VB_006_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-006",
  title: "Zero — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_VB_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-006/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-44",
  mainFrameCount: 163,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze(
    COURSE_G04_L03_VB_006_GLOSSARY_HOTSPOTS.map((hotspot) =>
      Object.freeze({
        id: hotspot.id,
        firstFrame: hotspot.firstFrame,
        lastFrame: hotspot.lastFrame,
      }),
    ),
  ),
  sourceControlBehaviorLabel:
    "All four source glossary hotspots and their host callbacks are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_VB_006_AUTHORITY = Object.freeze({
  implementationAuthorized: false,
  migrationScaffoldMayBeCreated: false,
  registryIsPrototypeOnly: true,
  productRouteMayBeAdded: false,
  strictLedgerMayBeChanged: false,
  publicStrictLibraryAdmission: false,
  legacyActionScriptExecuted: false,
  hotspotPointerEventsEnabled: false,
  embeddedAudioRendered: false,
  associatedAudioRendered: false,
  spanishVisualRuntimeEstablished: false,
  rootCompositionEstablished: false,
  companionCompositionEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  currentJavascriptFunctionalCandidateImplemented: true,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
