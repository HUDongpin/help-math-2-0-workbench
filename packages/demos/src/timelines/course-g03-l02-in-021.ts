import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_021_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN21.swf",
  "swfSha256": "7770c9721c6254f47c7640b4a0986e6bb43c30c6b2a55a647ed49c2a79d8361e",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN21.fla",
  "flaSha256": "a6abd6836caf1c4ba4c1afa18705362979deb4d7384b77249edd17e4bdc674ae",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN21.mp3",
  "associatedAudioSha256": "4447b02b195f01e05d184d41d9f03e7be3f40c7b0f60b2654eaf8aa24ce6f262",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 89,
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

export const COURSE_G03_L02_IN_021_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-021",
  title: "Subtraction — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_021_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-021/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-89",
  mainFrameCount: 299,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-3",
    "frameCount": 1,
    "label": "Separate source sprite 3"
  },
  {
    "id": "sprite-57",
    "frameCount": 10,
    "label": "Separate source sprite 57"
  },
  {
    "id": "sprite-65",
    "frameCount": 5,
    "label": "Separate source sprite 65"
  },
  {
    "id": "sprite-70",
    "frameCount": 15,
    "label": "Separate source sprite 70"
  },
  {
    "id": "sprite-72",
    "frameCount": 20,
    "label": "Separate source sprite 72"
  },
  {
    "id": "sprite-75",
    "frameCount": 10,
    "label": "Separate source sprite 75"
  },
  {
    "id": "sprite-78",
    "frameCount": 10,
    "label": "Separate source sprite 78"
  },
  {
    "id": "sprite-82",
    "frameCount": 10,
    "label": "Separate source sprite 82"
  },
  {
    "id": "sprite-85",
    "frameCount": 10,
    "label": "Separate source sprite 85"
  },
  {
    "id": "sprite-88",
    "frameCount": 10,
    "label": "Separate source sprite 88"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 299}),
  ]),
  sourceControlBehaviorLabel: "7 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_021_AUTHORITY = Object.freeze({
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
