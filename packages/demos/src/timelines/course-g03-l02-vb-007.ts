import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_007_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB07.swf",
  "swfSha256": "d06fd772837629881207f7849214cd288870b58f1fc4d137388f7ab375e9bdee",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB07.fla",
  "flaSha256": "ba0978c1f8baa37e5d760a5e8705d09a99de22aa1d9c11ea68eb2cb58c906e72",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB07.mp3",
  "associatedAudioSha256": "b466973d956da62288e71acf58dbe0f15bf567af45d04a0609e217e6c053f80b",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 65,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 8648,
    "y": 4766
  },
  "rootPlacementPixels": {
    "x": 432.4,
    "y": 238.3
  }
});

export const COURSE_G03_L02_VB_007_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-007",
  title: "Addend, Sum — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_007_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-007/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-65",
  mainFrameCount: 172,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-5",
    "frameCount": 1,
    "label": "Separate source sprite 5"
  },
  {
    "id": "sprite-37",
    "frameCount": 1,
    "label": "Separate source sprite 37"
  },
  {
    "id": "sprite-44",
    "frameCount": 1,
    "label": "Separate source sprite 44"
  },
  {
    "id": "sprite-50",
    "frameCount": 1,
    "label": "Separate source sprite 50"
  },
  {
    "id": "sprite-55",
    "frameCount": 1,
    "label": "Separate source sprite 55"
  },
  {
    "id": "sprite-61",
    "frameCount": 1,
    "label": "Separate source sprite 61"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 172}),
  ]),
  sourceControlBehaviorLabel: "4 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_007_AUTHORITY = Object.freeze({
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
