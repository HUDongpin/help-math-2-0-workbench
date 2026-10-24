import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_TS_006_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/TS/L2TS06.swf",
  "swfSha256": "2604222b1666480568fc50929f68df43f6a1d8e4cc33fcd4d9d8f973c5187bdb",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/TS/L2TS06.fla",
  "flaSha256": "88dd44dd5aa940c58c1b13a3ea5be8c6fcf2e505f2c356c19e9dd9b3e4037c5e",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2TS06.mp3",
  "associatedAudioSha256": "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 13,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 8241,
    "y": 5668
  },
  "rootPlacementPixels": {
    "x": 412.05,
    "y": 283.4
  }
});

export const COURSE_G03_L02_TS_006_CONFIG = Object.freeze({
  animationId: "course-g03-l02-ts-006",
  title: "4 Step Plan — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_TS_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-ts-006/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-13",
  mainFrameCount: 246,
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
    Object.freeze({id: "linear-timeline-review", firstFrame: 1, lastFrame: 246}),
  ]),
  sourceControlBehaviorLabel: "Source timeline controls, embedded stream timing, and original host composition remain acceptance-unvalidated",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_TS_006_AUTHORITY = Object.freeze({
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
