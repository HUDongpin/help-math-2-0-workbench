import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_014_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB14.swf",
  "swfSha256": "3125b50f637042dd83057f12bdea98102d013bfd84d813b13435fc15c83fff64",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB14.fla",
  "flaSha256": "8c53950e6d20b31de8fcf1b0fd523c9a377eb69e6797cff1046ce3bc1467ce53",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB14.mp3",
  "associatedAudioSha256": "817840b95d8aae4dcf405d984c6b050ca66ec1187fbdbad1c12114b1eb02a441",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 67,
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

export const COURSE_G03_L02_VB_014_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-014",
  title: "Inverse Operations — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_014_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-014/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-67",
  mainFrameCount: 339,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 339}),
  ]),
  sourceControlBehaviorLabel: "1 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_014_AUTHORITY = Object.freeze({
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
