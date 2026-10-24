import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_008_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB08.swf",
  "swfSha256": "66d5a1ab4676a0bdd1d85727ceaf7fbd4f98b140a18f54dfb43eb4e95aa9b1ee",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB08.fla",
  "flaSha256": "c4af34998002a61ff2d0dadfc5cb291fd74e4bc021ffcde33cf1b7778e0e5429",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB08.mp3",
  "associatedAudioSha256": "ef38cbc79af1bfa36b59cfb05e1934397f446e6930b6bd88ba5e09b9685cfa7b",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 27,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 8026,
    "y": 4885
  },
  "rootPlacementPixels": {
    "x": 401.3,
    "y": 244.25
  }
});

export const COURSE_G03_L02_VB_008_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-008",
  title: "Subtraction — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_008_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-008/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-27",
  mainFrameCount: 411,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-5",
    "frameCount": 1,
    "label": "Separate source sprite 5"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 411}),
  ]),
  sourceControlBehaviorLabel: "3 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_008_AUTHORITY = Object.freeze({
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
