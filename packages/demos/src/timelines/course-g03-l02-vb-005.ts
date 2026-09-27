import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_005_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB05.swf",
  "swfSha256": "4f0ee38b6a807cc42ddec7e7e3d3f82f9295ee9c5d076cc1d153dcce18b81bd7",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB05.fla",
  "flaSha256": "0439f07dbfb1471df122a78b14187ba28197853e34ebb38d71a92920c07b8d4b",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB05.mp3",
  "associatedAudioSha256": "7dfee90501eb8f15197500d55a91b6fd47ad322a3c4c0d02ab46e721e733323d",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 30,
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

export const COURSE_G03_L02_VB_005_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-005",
  title: "Addend, Sum — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-005/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-30",
  mainFrameCount: 287,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 287}),
  ]),
  sourceControlBehaviorLabel: "5 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_005_AUTHORITY = Object.freeze({
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
