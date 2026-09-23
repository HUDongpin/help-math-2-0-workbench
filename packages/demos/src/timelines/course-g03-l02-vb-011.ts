import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_011_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB11.swf",
  "swfSha256": "00416348cbb4b3f5439c5d4957da2445de78b6ef3ac3d4efff6592100db6ecb7",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB11.fla",
  "flaSha256": "7aead3904b76b61e306409336a569250096a23b8426c0a0fb85e4c69f722e0aa",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB11.mp3",
  "associatedAudioSha256": "ffe796b7b97f0ad724bc48f2957552f86b2a4eea27eb75ecb873a52c90c3c007",
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

export const COURSE_G03_L02_VB_011_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-011",
  title: "Difference — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_011_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-011/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-65",
  mainFrameCount: 171,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-5",
    "frameCount": 1,
    "label": "Separate source sprite 5"
  },
  {
    "id": "sprite-39",
    "frameCount": 1,
    "label": "Separate source sprite 39"
  },
  {
    "id": "sprite-45",
    "frameCount": 1,
    "label": "Separate source sprite 45"
  },
  {
    "id": "sprite-51",
    "frameCount": 1,
    "label": "Separate source sprite 51"
  },
  {
    "id": "sprite-56",
    "frameCount": 1,
    "label": "Separate source sprite 56"
  },
  {
    "id": "sprite-61",
    "frameCount": 1,
    "label": "Separate source sprite 61"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 171}),
  ]),
  sourceControlBehaviorLabel: "5 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_011_AUTHORITY = Object.freeze({
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
