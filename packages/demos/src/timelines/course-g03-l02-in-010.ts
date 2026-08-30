import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_010_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN10.swf",
  "swfSha256": "d5c21547c8976b217aa741426f44517572a13b9a9387e9a904e97c0301af6737",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN10.fla",
  "flaSha256": "67e46565a085412b2df58c973f8d3d3d55a174caed0c77da24835d09ed5d52a7",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN10.mp3",
  "associatedAudioSha256": "48e27ec8834c5e2e532449e3355c736df580abd4aad2c91821308fe8e516c189",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 49,
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

export const COURSE_G03_L02_IN_010_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-010",
  title: "Adding 2 Digit Numbers without Regrouping — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_010_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-010/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-49",
  mainFrameCount: 891,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 891}),
  ]),
  sourceControlBehaviorLabel: "7 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_010_AUTHORITY = Object.freeze({
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
