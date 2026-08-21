import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_025_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN25.swf",
  "swfSha256": "aa4400f638e84e462d89c970412c2b086948cc022bb7cd9b3d81ca6259f5f276",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN25.fla",
  "flaSha256": "cd50d67c4ebe39a84cfec76f5d21ad7c233517517eb576a6500538d49381aed6",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN25.mp3",
  "associatedAudioSha256": "e7adefe51b2717823b083d6ee5c7f246b92eb7d3f3ec74d9a4a515b9fcb0f0be",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 78,
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

export const COURSE_G03_L02_IN_025_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-025",
  title: "Subtracting Tens — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_025_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-025/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-78",
  mainFrameCount: 624,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-1",
    "frameCount": 3,
    "label": "Separate source sprite 1"
  },
  {
    "id": "sprite-11",
    "frameCount": 1,
    "label": "Separate source sprite 11"
  },
  {
    "id": "sprite-18",
    "frameCount": 1,
    "label": "Separate source sprite 18"
  },
  {
    "id": "sprite-21",
    "frameCount": 1,
    "label": "Separate source sprite 21"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 624}),
  ]),
  sourceControlBehaviorLabel: "7 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_025_AUTHORITY = Object.freeze({
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
