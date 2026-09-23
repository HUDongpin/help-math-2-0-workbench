import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

export const COURSE_G04_L03_VB_005_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB05.swf",
  swfSha256:
    "7595fa85408ef64720006e0e24a02505507aebfd89282a5709bab97e09b162d6",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB05.fla",
  flaSha256:
    "b63ccfb65ed4e89b025efccf256b552a0f48831b758827cc1f39f0ffc0b7ec94",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB05.mp3",
  associatedAudioSha256:
    "4cd42bda4932132d37215de80674ad645ee41a917aeefd37cae36d00ba620f9f",
  embeddedAudioSha256:
    "fc28d20d948520884b26babb83ac499b0d4e98f5d24bc05e8b63ac9c30bbc2af",
  spriteObjectId: 53,
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
export const COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "negative-number",
    characterId: 11,
    keyAttribute: "Negative number",
    firstFrame: 1,
    lastFrame: 180,
    depth: 5,
    sourceBounds: Object.freeze({
      left: 79.7635,
      right: 253.6924,
      top: 118.9144,
      bottom: 141.4268,
    }),
    entryIds: Object.freeze({
      en: "en-0411-1954bd66c84d",
      es: "es-0456-9da6d6ebd619",
    }),
    labels: Object.freeze({en: "Negative number", es: "Número negativo"}),
  }),
  Object.freeze({
    id: "less-than",
    characterId: 12,
    keyAttribute: "Less than",
    firstFrame: 1,
    lastFrame: 180,
    depth: 7,
    sourceBounds: Object.freeze({
      left: 293.3732,
      right: 378.9559,
      top: 118.9144,
      bottom: 141.4268,
    }),
    entryIds: Object.freeze({
      en: "en-0344-ac5e44095a38",
      es: "es-0401-7b42de19e998",
    }),
    labels: Object.freeze({en: "Less than", es: "Menor que"}),
  }),
  Object.freeze({
    id: "zero",
    characterId: 13,
    keyAttribute: "Zero",
    firstFrame: 1,
    lastFrame: 180,
    depth: 9,
    sourceBounds: Object.freeze({
      left: 383.4251,
      right: 424.7407,
      top: 118.9144,
      bottom: 141.4268,
    }),
    entryIds: Object.freeze({
      en: "en-0760-6575e63919df",
      es: "es-0057-e01a19219cce",
    }),
    labels: Object.freeze({en: "Zero", es: "Cero"}),
  }),
] as const);

export const COURSE_G04_L03_VB_005_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-005",
  frameDomain: "sprite-53",
  terms: COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS,
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G04_L03_VB_005_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-005",
  title: "Negative Numbers — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_VB_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-005/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-53",
  mainFrameCount: 180,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze(
    COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS.map((hotspot) =>
      Object.freeze({
        id: hotspot.id,
        firstFrame: hotspot.firstFrame,
        lastFrame: hotspot.lastFrame,
      }),
    ),
  ),
  sourceControlBehaviorLabel:
    "All three source glossary hotspots and their host callbacks are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_VB_005_AUTHORITY = Object.freeze({
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
