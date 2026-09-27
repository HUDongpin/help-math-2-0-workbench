import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_006_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN06.swf",
  "swfSha256": "fdfc091b0e3122444885b1e8e64d0ef2493a18da1cff8ec122d8f69b71d305bc",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN06.fla",
  "flaSha256": "12c8a77901a7b7aaccfca448bc485d6f419769074c9e11d92568100bd9b5fc12",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN06.mp3",
  "associatedAudioSha256": "a1d76665148c2ffc476010fd4db2d2dec546d596f10d5dd83bff587fad44848d",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 104,
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

export const COURSE_G03_L02_IN_006_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-006",
  title: "Addition Fact Tables — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-006/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-104",
  mainFrameCount: 368,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-3",
    "frameCount": 1,
    "label": "Separate source sprite 3"
  },
  {
    "id": "sprite-84",
    "frameCount": 4,
    "label": "Separate source sprite 84"
  },
  {
    "id": "sprite-87",
    "frameCount": 77,
    "label": "Separate source sprite 87"
  },
  {
    "id": "sprite-91",
    "frameCount": 10,
    "label": "Separate source sprite 91"
  },
  {
    "id": "sprite-94",
    "frameCount": 1,
    "label": "Separate source sprite 94"
  },
  {
    "id": "sprite-95",
    "frameCount": 17,
    "label": "Separate source sprite 95"
  },
  {
    "id": "sprite-97",
    "frameCount": 55,
    "label": "Separate source sprite 97"
  },
  {
    "id": "sprite-99",
    "frameCount": 20,
    "label": "Separate source sprite 99"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 368}),
  ]),
  sourceControlBehaviorLabel: "4 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_006_AUTHORITY = Object.freeze({
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
