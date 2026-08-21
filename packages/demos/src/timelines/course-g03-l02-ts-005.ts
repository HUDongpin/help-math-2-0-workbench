import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_TS_005_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/TS/L2TS05.swf",
  "swfSha256": "23e43bb92ec05755706c95575f83457ff53af1ba0608dc81dddbf852dd04758d",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/TS/L2TS05.fla",
  "flaSha256": "ffba46ef14986be299c055b8b299ecc28677291c9fd543f9fc938d105ab5479e",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2TS05.mp3",
  "associatedAudioSha256": "153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 32,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 7477,
    "y": 5666
  },
  "rootPlacementPixels": {
    "x": 373.85,
    "y": 283.3
  }
});

export const COURSE_G03_L02_TS_005_CONFIG = Object.freeze({
  animationId: "course-g03-l02-ts-005",
  title: "4 Step Plan — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_TS_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-ts-005/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-32",
  mainFrameCount: 236,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 236}),
  ]),
  sourceControlBehaviorLabel: "5 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_TS_005_AUTHORITY = Object.freeze({
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
