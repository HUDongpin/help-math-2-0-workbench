import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G03_L02_VB_003_SOURCE = Object.freeze({
  "swf": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB03.swf",
  "swfSha256": "ce096a07e9aef80abc7cd76da6a68107f87ae18cb1faa419befd55272e83ad90",
  "fla": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/VB/L2VB03.fla",
  "flaSha256": "82f818bc8db36c05465558ee843f8b97305ca925dca7a44aa645d8f79411d224",
  "associatedAudio": "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L2/SA/L2VB03.mp3",
  "associatedAudioSha256": "3e9d02a564a96cf5a5d299f65277a5ccd4ff7a59c77b866318afbcbd97585838",
  "associatedAudioLanguage": "und",
  "spriteObjectId": 69,
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

export const COURSE_G03_L02_VB_003_CONFIG = Object.freeze({
  animationId: "course-g03-l02-vb-003",
  title: "Model — G3 L2 source-static Current-JavaScript candidate",
  sourceSwfSha256: COURSE_G03_L02_VB_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g03-l02-vb-003/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-69",
  mainFrameCount: 523,
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze([
  {
    "id": "sprite-5",
    "frameCount": 1,
    "label": "Separate source sprite 5"
  },
  {
    "id": "sprite-51",
    "frameCount": 1,
    "label": "Separate source sprite 51"
  },
  {
    "id": "sprite-54",
    "frameCount": 1,
    "label": "Separate source sprite 54"
  },
  {
    "id": "sprite-57",
    "frameCount": 1,
    "label": "Separate source sprite 57"
  },
  {
    "id": "sprite-60",
    "frameCount": 1,
    "label": "Separate source sprite 60"
  },
  {
    "id": "sprite-63",
    "frameCount": 1,
    "label": "Separate source sprite 63"
  },
  {
    "id": "sprite-66",
    "frameCount": 1,
    "label": "Separate source sprite 66"
  },
  {
    "id": "sprite-68",
    "frameCount": 1,
    "label": "Separate source sprite 68"
  }
]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "interaction-contract-review", firstFrame: 1, lastFrame: 523}),
  ]),
  sourceControlBehaviorLabel: "6 source button action(s), 0 clip action(s), and all legacy host calls remain inert",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G03_L02_VB_003_AUTHORITY = Object.freeze({
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
