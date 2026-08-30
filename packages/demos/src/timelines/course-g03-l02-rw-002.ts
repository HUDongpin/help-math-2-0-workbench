import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

export const COURSE_G03_L02_RW_002_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/RW/L2RW02.swf",
  "swfSha256": "ffdac774c9dc565b908ff5ac717c629ce29a7001b6b52009d3176c0ede442973",
  "fla": null,
  "flaSha256": null,
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2RW02.mp3",
  "associatedAudioSha256": "9e2b4e29f96dc2d1c11547d49af4bbfa3f8140f49214048e3f5758c301f4d830",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 284,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 7219,
    "y": 5460
  },
  "rootPlacementPixels": {
    "x": 360.95,
    "y": 273
  }
});

export const COURSE_G03_L02_RW_002_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "number",
    characterId: 235,
    keyAttribute: "Number",
    firstFrame: 732,
    lastFrame: 1056,
    depth: 97,
    sourceBounds: Object.freeze({left: 130.1, right: 194.15, top: 288.25, bottom: 309.743}),
    entryIds: Object.freeze({en: "en-0423-3bcf1a5c2467", es: "es-0453-4b5725cf77e3"}),
    labels: Object.freeze({en: "Number", es: "Número"}),
  }),
] as const);

export const COURSE_G03_L02_RW_002_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g03-l02-rw-002",
  frameDomain: "sprite-284",
  terms: COURSE_G03_L02_RW_002_GLOSSARY_HOTSPOTS,
  playbackDisposition: "source-stop-timeline-and-audio-until-explicit-resume",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

export const COURSE_G03_L02_RW_002_CONFIG = Object.freeze({
  animationId: "course-g03-l02-rw-002",
  title: "Page 1 — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_RW_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-rw-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-284",
  mainFrameCount: 1077,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-94",
    "frameCount": 80,
    "label": "Separate source sprite 94"
  },
  {
    "id": "sprite-114",
    "frameCount": 43,
    "label": "Separate source sprite 114"
  },
  {
    "id": "sprite-254",
    "frameCount": 22,
    "label": "Separate source sprite 254"
  },
  {
    "id": "sprite-288",
    "frameCount": 1,
    "label": "Separate source sprite 288"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 1077}),
  ]),
  sourceControlBehaviorLabel: "1 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_RW_002_AUTHORITY = Object.freeze({
  pageOnlyCurrentJavascriptCandidate: true,
  structuralDrawingProjection: true,
  legacyActionScriptExecuted: false,
  embeddedAudioRendered: false,
  associatedAudioUserCandidate: true,
  associatedAudioLanguageEstablished: false,
  audioListeningAccepted: false,
  behaviorParityEstablished: false,
  originalRuntimeEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  released: false,
  published: false,
  strictAcceptanceEffect: "none",
});
