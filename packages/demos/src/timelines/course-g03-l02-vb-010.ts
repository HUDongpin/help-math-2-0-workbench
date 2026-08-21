import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_010_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB10.swf",
  "swfSha256": "6cca268a4f95c12a27f9aa2b772c2d95ed3809e2ee025291c0b7904de836bace",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB10.fla",
  "flaSha256": "4b5345deae6109c12f680a2e1926b6e6b1cefa4ac7451c9fb3871cb19c4d4f7e",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB10.mp3",
  "associatedAudioSha256": "9cb4d275b325054e16ac021bb78954bbe342f3bb15af9d101cfae07f6f79c060",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 199,
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

export const COURSE_G03_L02_VB_010_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-010",
  title: "Difference — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_010_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-010/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-199",
  mainFrameCount: 135,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-5",
    "frameCount": 1,
    "label": "Separate source sprite 5"
  },
  {
    "id": "sprite-58",
    "frameCount": 5,
    "label": "Separate source sprite 58"
  },
  {
    "id": "sprite-60",
    "frameCount": 1,
    "label": "Separate source sprite 60"
  },
  {
    "id": "sprite-69",
    "frameCount": 28,
    "label": "Separate source sprite 69"
  },
  {
    "id": "sprite-80",
    "frameCount": 28,
    "label": "Separate source sprite 80"
  },
  {
    "id": "sprite-92",
    "frameCount": 29,
    "label": "Separate source sprite 92"
  },
  {
    "id": "sprite-126",
    "frameCount": 27,
    "label": "Separate source sprite 126"
  },
  {
    "id": "sprite-138",
    "frameCount": 27,
    "label": "Separate source sprite 138"
  },
  {
    "id": "sprite-166",
    "frameCount": 28,
    "label": "Separate source sprite 166"
  },
  {
    "id": "sprite-191",
    "frameCount": 27,
    "label": "Separate source sprite 191"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 135}),
  ]),
  sourceControlBehaviorLabel: "5 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_010_AUTHORITY = Object.freeze({
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
