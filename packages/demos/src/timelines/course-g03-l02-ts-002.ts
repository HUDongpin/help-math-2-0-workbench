import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_TS_002_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/TS/L2TS02.swf",
  "swfSha256": "8acc635a47beda68f6ea54cc81fee89fc677a0af5771ea05c6b98751f78f695e",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/TS/L2TS02.fla",
  "flaSha256": "c799620c74956e94311e51864597ce35d7b891ff262080a6d481e87a969e217a",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2TS02.mp3",
  "associatedAudioSha256": "148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 29,
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

export const COURSE_G03_L02_TS_002_CONFIG = Object.freeze({
  animationId: "course-g03-l02-ts-002",
  title: "4 Step Plan — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_TS_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-ts-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-29",
  mainFrameCount: 325,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-6",
    "frameCount": 1,
    "label": "Separate source sprite 6"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 325}),
  ]),
  sourceControlBehaviorLabel: "3 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_TS_002_AUTHORITY = Object.freeze({
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
