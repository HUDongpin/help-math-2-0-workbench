import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_016_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN16.swf",
  "swfSha256": "c4bc7dc6732b9afde40906d66a056e1a44da6a8def8c60b6e93ea44897ba264c",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN16.fla",
  "flaSha256": "020f389ac9a40f093a47338b7c2d760e7559167c299a9bb74ef2b549930651dd",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN16.mp3",
  "associatedAudioSha256": "e671ca233e5eee906214df9ac48eceda8b32eff3309a623e4047b26dce442447",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 45,
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

export const COURSE_G03_L02_IN_016_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-016",
  title: "Addition Equations with Three - digit Numbers — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_016_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-016/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-45",
  mainFrameCount: 746,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 746}),
  ]),
  sourceControlBehaviorLabel: "4 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_016_AUTHORITY = Object.freeze({
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
