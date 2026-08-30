import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_IN_031_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/IN/L2IN31.swf",
  "swfSha256": "9520101f5f286af37fddfce30014eda64bd9caf9b93d24a51edb87912819bf8c",
  "fla": null,
  "flaSha256": null,
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2IN31.mp3",
  "associatedAudioSha256": "29860c459cae71de1a9bc2c2ce606cea1979a9ba376cc75fb3ddc982fd347fe1",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 52,
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

export const COURSE_G03_L02_IN_031_CONFIG = Object.freeze({
  animationId: "course-g03-l02-in-031",
  title: "Subtraction Using Pencil and Paper — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_IN_031_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-in-031/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-52",
  mainFrameCount: 1669,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 1669}),
  ]),
  sourceControlBehaviorLabel: "2 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_IN_031_AUTHORITY = Object.freeze({
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
