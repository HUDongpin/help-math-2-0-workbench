import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_RW_004_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/RW/L2RW04.swf",
  "swfSha256": "5613dcb67532baea7656e32310713a147f7c5c914b9dda02bb042a4b1cc283d6",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/RW/L2RW04.fla",
  "flaSha256": "da4ffa8b79c78d5292f9895c379ceff1b68cb2b41c42c72e85388c1763857bb1",
  "associatedAudio": null,
  "associatedAudioSha256": null,
  "associatedAudioLanguage": null,
  "spriteObjectId": 103,
  "rootBeginFrame": 6,
  "rootPlacementTwips": {
    "x": 7159,
    "y": 5500
  },
  "rootPlacementPixels": {
    "x": 357.95,
    "y": 275
  }
});

export const COURSE_G03_L02_RW_004_CONFIG = Object.freeze({
  animationId: "course-g03-l02-rw-004",
  title: "Page 3 — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_RW_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-rw-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-103",
  mainFrameCount: 873,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-107",
    "frameCount": 1,
    "label": "Separate source sprite 107"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 873}),
  ]),
  sourceControlBehaviorLabel: "4 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_RW_004_AUTHORITY = Object.freeze({
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
