import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_013_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN13.swf",
  "swfSha256": "072333fc9f3e03654c31c194c4f062996b28af288e2c59087347f09bf4ac3410",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN13.fla",
  "flaSha256": "27cbaa6021b555da4a86579e93fb9224b96f3267ca08d7f5bdc8672bfde102fc",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN13.mp3",
  "associatedAudioSha256": "98f096b9875d740b813bb68beeaba3a0af55b7ea050abf4ba9d8a10505a3ce51",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 61,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 8268,
    "y": 5666
  },
  "rootPlacementPixels": {
    "x": 413.4,
    "y": 283.3
  }
});

export const COURSE_G03_L02_IN_013_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-013",
  title: "Adding with Regrouping — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_013_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-013/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-61",
  mainFrameCount: 1015,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-3",
    "frameCount": 1,
    "label": "Separate source sprite 3"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 1015}),
  ]),
  sourceControlBehaviorLabel: "4 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_013_AUTHORITY = Object.freeze({
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
