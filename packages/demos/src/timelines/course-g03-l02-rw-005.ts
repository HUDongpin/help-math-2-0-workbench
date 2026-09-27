import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_RW_005_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/RW/L2RW05.swf",
  "swfSha256": "46bffa65d7eece1eed64fa57375657b94f04916057e38e84af8d06e1460f8bed",
  "fla": null,
  "flaSha256": null,
  "associatedAudio": null,
  "associatedAudioSha256": null,
  "associatedAudioLanguage": null,
  "spriteObjectId": 212,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 7219,
    "y": 5460
  },
  "rootPlacementPixels": {
    "x": 360.95,
    "y": 273
  }
});

export const COURSE_G03_L02_RW_005_CONFIG = Object.freeze({
  animationId: "course-g03-l02-rw-005",
  title: "Page 4 — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_RW_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-rw-005/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-212",
  mainFrameCount: 320,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-73",
    "frameCount": 22,
    "label": "Separate source sprite 73"
  },
  {
    "id": "sprite-216",
    "frameCount": 1,
    "label": "Separate source sprite 216"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 320}),
  ]),
  sourceControlBehaviorLabel: "6 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_RW_005_AUTHORITY = Object.freeze({
  pageOnlyCurrentJavascriptCandidate: true,
  structuralDrawingProjection: true,
  legacyActionScriptExecuted: false,
  embeddedAudioRendered: false,
  associatedAudioUserCandidate: false,
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
