import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_027_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN27.swf",
  "swfSha256": "6fbcfa812a9d9117a3df878bf2fb5b7ddf8aace0b9320b26423e4b693393a8b2",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN27.fla",
  "flaSha256": "caa529d5d0871bdca21dfaa498f57cf16829852fc05b9c158881faf63472c1d4",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN27.mp3",
  "associatedAudioSha256": "5f5859599a05d0196221f3be5c92b82c7a35e5bd0d59c056ca0f265c539c7bf6",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 89,
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

export const COURSE_G03_L02_IN_027_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-027",
  title: "Subtraction with Regrouping/Borrowing — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_027_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-027/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-89",
  mainFrameCount: 1009,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 1009}),
  ]),
  sourceControlBehaviorLabel: "6 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_027_AUTHORITY = Object.freeze({
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
