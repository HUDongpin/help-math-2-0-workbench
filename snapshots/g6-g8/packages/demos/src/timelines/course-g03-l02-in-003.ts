import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_003_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN03.swf",
  "swfSha256": "e09306603a3e2c2a80302e03a816c70ff7bf8a293dabdd4f19ffb2daf643dc33",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN03.fla",
  "flaSha256": "0e1c7be8f6201f16bc42a218226af2825919961bee1aefa7805429d776ab3508",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN03.mp3",
  "associatedAudioSha256": "5200584a0f0049528507c40803aafbf7b177981824bbf5e62551759df9c7af8f",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 19,
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

export const COURSE_G03_L02_IN_003_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-003",
  title: "Review Addition Facts Using Base Ten Blocks — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-003/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-19",
  mainFrameCount: 188,
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
    Object.freeze({id: "linear-timeline-review", firstFrame: 1, lastFrame: 188}),
  ]),
  sourceControlBehaviorLabel: "Source timeline controls, embedded stream timing, and original host composition remain acceptance-unvalidated",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_003_AUTHORITY = Object.freeze({
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
