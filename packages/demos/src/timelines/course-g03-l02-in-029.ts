import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_029_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN29.swf",
  "swfSha256": "056316e77d51e3f7b98a99599b63ef1ccf84bdf77f624be68b8e2774ab62e7bf",
  "fla": null,
  "flaSha256": null,
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN29.mp3",
  "associatedAudioSha256": "2313ed6ab72ffe105127e82bd5ec131a40d0e2f4ad6a0c070c3585fd1f0a66d6",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 91,
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

export const COURSE_G03_L02_IN_029_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-029",
  title: "Subtraction with Three Digit Numbers and Renaming (Borrowing) — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_029_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-029/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-91",
  mainFrameCount: 1328,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-1",
    "frameCount": 3,
    "label": "Separate source sprite 1"
  },
  {
    "id": "sprite-11",
    "frameCount": 1,
    "label": "Separate source sprite 11"
  },
  {
    "id": "sprite-18",
    "frameCount": 1,
    "label": "Separate source sprite 18"
  },
  {
    "id": "sprite-21",
    "frameCount": 1,
    "label": "Separate source sprite 21"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 1328}),
  ]),
  sourceControlBehaviorLabel: "8 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_029_AUTHORITY = Object.freeze({
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
