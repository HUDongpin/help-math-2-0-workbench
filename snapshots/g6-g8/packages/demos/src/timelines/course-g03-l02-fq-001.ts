import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_FQ_001_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/FQ/L2FQ01.swf",
  "swfSha256": "9a2b2792c6a6dcd6798d4b90f2ffcaa49d6647d8768c695a57e1f219b13f9f8e",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/FQ/L2FQ01.fla",
  "flaSha256": "7cc370db44d27d333e781a7262ad8ff4ccd746101f875c9027f4ead22c44b753",
  "associatedAudio": null,
  "associatedAudioSha256": null,
  "associatedAudioLanguage": null,
  "spriteObjectId": 41,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 8248,
    "y": 5666
  },
  "rootPlacementPixels": {
    "x": 412.4,
    "y": 283.3
  }
});

export const COURSE_G03_L02_FQ_001_CONFIG = Object.freeze({
  animationId: "course-g03-l02-fq-001",
  title: "Introduction — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_FQ_001_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-fq-001/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-41",
  mainFrameCount: 52,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-1",
    "frameCount": 1,
    "label": "Separate source sprite 1"
  },
  {
    "id": "sprite-2",
    "frameCount": 3,
    "label": "Separate source sprite 2"
  },
  {
    "id": "sprite-3",
    "frameCount": 1,
    "label": "Separate source sprite 3"
  },
  {
    "id": "sprite-4",
    "frameCount": 3,
    "label": "Separate source sprite 4"
  },
  {
    "id": "sprite-5",
    "frameCount": 1,
    "label": "Separate source sprite 5"
  },
  {
    "id": "sprite-22",
    "frameCount": 1,
    "label": "Separate source sprite 22"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "linear-timeline-review", firstFrame: 1, lastFrame: 52}),
  ]),
  sourceControlBehaviorLabel: "Source timeline controls, embedded stream timing, and original host composition remain acceptance-unvalidated",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_FQ_001_AUTHORITY = Object.freeze({
  pageOnlyCurrentJavascriptCandidate: true,
  structuralDrawingProjection: true,
  legacyActionScriptExecuted: false,
  embeddedAudioRendered: false,
  associatedAudioUserCandidate: false,
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
