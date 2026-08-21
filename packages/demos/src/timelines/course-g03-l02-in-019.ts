import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_019_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN19.swf",
  "swfSha256": "d6c02aa343b2472e6d770aa50bc6e2103e8fd439ce8cc1702e1400080265b6ab",
  "fla": null,
  "flaSha256": null,
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN19.mp3",
  "associatedAudioSha256": "6018eb3b9644c54cf06d56382b648d4428bc26c8dc5a3878b5cb934e790333e9",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 54,
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

export const COURSE_G03_L02_IN_019_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-019",
  title: "Subtraction — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_019_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-019/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-54",
  mainFrameCount: 461,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 461}),
  ]),
  sourceControlBehaviorLabel: "2 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_019_AUTHORITY = Object.freeze({
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
