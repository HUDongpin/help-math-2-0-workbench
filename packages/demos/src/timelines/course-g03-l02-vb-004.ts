import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_004_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB04.swf",
  "swfSha256": "74e96cf71ba3f3c253e46aabab48b38fc3213f9c1360823ec7a2f688e77d9d81",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB04.fla",
  "flaSha256": "bd8fd1545ec609a1190d42c22b03cf1a21eb92bb9c97b4dfe058b0f7c2c03448",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB04.mp3",
  "associatedAudioSha256": "0b1df04496b310ef5ec84d2b3718c286f30b1ea9d74a9c577dd5d9f468ade0df",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 44,
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

export const COURSE_G03_L02_VB_004_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-004",
  title: "Addition — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-44",
  mainFrameCount: 424,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 424}),
  ]),
  sourceControlBehaviorLabel: "7 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_004_AUTHORITY = Object.freeze({
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
