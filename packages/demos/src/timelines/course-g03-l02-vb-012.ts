import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_012_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB12.swf",
  "swfSha256": "53af849884a4016f022463e612dcf4581ae82ecb03895033bde2a7578cb96ece",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB12.fla",
  "flaSha256": "10d04887b9340a2d928ae45e3af187ca6bb528f7fe9862ea0fcbd8f9fbd448f7",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB12.mp3",
  "associatedAudioSha256": "a5e7622544bd857364fe86523390b4f9053db0f8b4811406c110384f746da8bb",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 22,
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

export const COURSE_G03_L02_VB_012_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-012",
  title: "Mental Math — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_012_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-012/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-22",
  mainFrameCount: 284,
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
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 284}),
  ]),
  sourceControlBehaviorLabel: "1 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_012_AUTHORITY = Object.freeze({
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
