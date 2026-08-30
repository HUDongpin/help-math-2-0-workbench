import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_RW_003_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/RW/L2RW03.swf",
  "swfSha256": "b31e341e6057a45405797891575246158a565ce98703648c0a9ff70ecc519112",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/RW/L2RW03.fla",
  "flaSha256": "d5857ffc17f9847ba0027bce0d552deb9e298ffd0c38a608e4e0347710c9dc7c",
  "associatedAudio": null,
  "associatedAudioSha256": null,
  "associatedAudioLanguage": null,
  "spriteObjectId": 82,
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

export const COURSE_G03_L02_RW_003_CONFIG = Object.freeze({
  animationId: "course-g03-l02-rw-003",
  title: "Page 2 — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_RW_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-rw-003/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-82",
  mainFrameCount: 1100,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-86",
    "frameCount": 1,
    "label": "Separate source sprite 86"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 1100}),
  ]),
  sourceControlBehaviorLabel: "4 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_RW_003_AUTHORITY = Object.freeze({
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
