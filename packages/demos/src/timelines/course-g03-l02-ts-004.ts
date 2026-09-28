import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_TS_004_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/TS/L2TS04.swf",
  "swfSha256": "71da9150d85ad45affa01a3963e010f1935e54046fccd4d8b485cc86ab969292",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/TS/L2TS04.fla",
  "flaSha256": "ae59f60a3363a2918f7bb0f2a3262a03972b0761ab71d819e96e9274792e501b",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2TS04.mp3",
  "associatedAudioSha256": "a2505e6988cca2f44777711d87175b385564a51c2cb5284c05d6246635cf5dbf",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 38,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 7430,
    "y": 5667
  },
  "rootPlacementPixels": {
    "x": 371.5,
    "y": 283.35
  }
});

export const COURSE_G03_L02_TS_004_CONFIG = Object.freeze({
  animationId: "course-g03-l02-ts-004",
  title: "4 Step Plan — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_TS_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-ts-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-38",
  mainFrameCount: 290,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 290}),
  ]),
  sourceControlBehaviorLabel: "7 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_TS_004_AUTHORITY = Object.freeze({
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
