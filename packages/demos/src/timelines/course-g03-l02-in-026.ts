import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_026_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN26.swf",
  "swfSha256": "98c30bb4ede61c10a8ca22feaf5a139fcb52d0890026f95cd06d0fe9a9009a49",
  "fla": null,
  "flaSha256": null,
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN26.mp3",
  "associatedAudioSha256": "25e7882d5a0029d78a5af9a643a2869f1600c22aebc8400475b31b3b5ef04fbf",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 124,
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

export const COURSE_G03_L02_IN_026_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-026",
  title: "Subtraction with Regrouping/Borrowing — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_026_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-026/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-124",
  mainFrameCount: 1589,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 1589}),
  ]),
  sourceControlBehaviorLabel: "6 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_026_AUTHORITY = Object.freeze({
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
