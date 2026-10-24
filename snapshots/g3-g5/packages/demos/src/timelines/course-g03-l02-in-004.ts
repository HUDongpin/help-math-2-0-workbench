import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_004_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN04.swf",
  "swfSha256": "ccffa1afcac24cf85c6e98da0560678f556b9656f30b3bc3f281402d20f2dfe8",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN04.fla",
  "flaSha256": "7b0a073a081f84ff66b314e4604882713ec91428e03a02ceb0e1e086ce201258",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN04.mp3",
  "associatedAudioSha256": "939dfe038e1b96dc7ae25eee7b4e2b6bee613bc11355cad258b7d491fb76955e",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 81,
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

export const COURSE_G03_L02_IN_004_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-004",
  title: "Review Addition Facts Using Base Ten Blocks — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-81",
  mainFrameCount: 228,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-3",
    "frameCount": 1,
    "label": "Separate source sprite 3"
  },
  {
    "id": "sprite-53",
    "frameCount": 10,
    "label": "Separate source sprite 53"
  },
  {
    "id": "sprite-61",
    "frameCount": 5,
    "label": "Separate source sprite 61"
  },
  {
    "id": "sprite-66",
    "frameCount": 15,
    "label": "Separate source sprite 66"
  },
  {
    "id": "sprite-68",
    "frameCount": 10,
    "label": "Separate source sprite 68"
  },
  {
    "id": "sprite-72",
    "frameCount": 10,
    "label": "Separate source sprite 72"
  },
  {
    "id": "sprite-74",
    "frameCount": 10,
    "label": "Separate source sprite 74"
  },
  {
    "id": "sprite-77",
    "frameCount": 10,
    "label": "Separate source sprite 77"
  },
  {
    "id": "sprite-80",
    "frameCount": 10,
    "label": "Separate source sprite 80"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 228}),
  ]),
  sourceControlBehaviorLabel: "7 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_004_AUTHORITY = Object.freeze({
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
