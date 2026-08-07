import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_VB_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB03.swf",
  swfSha256:
    "ab47ed70dd5bba5515011e6f156c5a985fa107ef7e426448fe65507e9927204a",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB03.fla",
  flaSha256:
    "263b18fb695f4b5b8f11db8774bfcc7312a485fb51d4f133cb7e08f3f34dd3ce",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB03.mp3",
  associatedAudioSha256:
    "068a69aaa9b11bc3c82f276a9c272345e8385401962b909f90a1e96f87426615",
  embeddedAudioStreamSha256: Object.freeze([
    "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "f3dd9d1aa8af71a821cdc5f251f8701102641d6de7d08d7cd4ae1090d291a507",
    "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
    "034c643e7c66161ebe3213aba4f8b28f23995f11224c9f43b80f42ecbc913567",
  ]),
  sourceScriptEvidence:
    "migrations/course-g04-l03-vb-003/audit/machine/ffdec-scripts.txt.gz",
  sourceScriptEvidenceSha256:
    "a76448ad6cae582373c4249f6d4d81fb8433bceb71edc91948e63952587d06a4",
  sourcePlacementEvidence:
    "migrations/course-g04-l03-vb-003/audit/machine/swfmill.xml.gz",
  sourcePlacementEvidenceSha256:
    "f5991cdfc388edcf72086ec4f973e14a331db72b0e63ef55b403b29374950c4c",
  spriteObjectId: 106,
  companionSpriteObjectId: 28,
  quizEntryFrame: 116,
  sourceStopAtQuizEntry: true,
  draggableObjectIds: Object.freeze([83, 84, 85, 86, 87]),
  draggableDepths: Object.freeze([74, 78, 81, 84, 88]),
  targetObjectIds: Object.freeze([79, 75, 76, 82, 73]),
  targetDepths: Object.freeze([68, 62, 65, 71, 59]),
  wrongFeedbackObjectId: 99,
  correctFeedbackObjectId: 105,
  correctCoachObjectId: 101,
  dragMatchSourceData: Object.freeze([
    Object.freeze({
      itemInstance: "Scr_2",
      label: "–2",
      targetInstance: "Mc_Tar_2",
    }),
    Object.freeze({
      itemInstance: "Scr_3",
      label: "2",
      targetInstance: "Mc_Tar_3",
    }),
    Object.freeze({
      itemInstance: "Scr_4",
      label: "0",
      targetInstance: "Mc_Tar_4",
    }),
    Object.freeze({
      itemInstance: "Scr_5",
      label: "–5",
      targetInstance: "Mc_Tar_5",
    }),
    Object.freeze({
      itemInstance: "Scr_6",
      label: "5",
      targetInstance: "Mc_Tar_6",
    }),
  ]),
  fixedExample: Object.freeze({
    label: "–7",
    targetInstance: "Mc_Tar_1",
    targetObjectId: 71,
    targetDepth: 91,
  }),
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_288, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 414.4, y: 283.3}),
});

export const COURSE_G04_L03_VB_003_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-003",
  title: "Number Line Practice — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_VB_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-003/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-106",
  mainFrameCount: 160,
  livePlaybackEndFrame: 116,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-28", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "number-line-practice", firstFrame: 1, lastFrame: 160}),
  ]),
  sourceControlBehaviorLabel:
    "The Canvas evidence path keeps all five source buttons, fifteen clip handlers, four embedded audio streams, the associated catalog-audio path, and their ActionScript behavior disabled; ordinary English product playback may add a separate source-script-bound current-JavaScript drag-match candidate at frame 116",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_VB_003_AUTHORITY = Object.freeze({
  implementationAuthorized: false,
  registryIsPrototypeOnly: true,
  productRouteMayBeAdded: false,
  strictLedgerMayBeChanged: false,
  publicStrictLibraryAdmission: false,
  legacyActionScriptExecuted: false,
  sourcePointerEventsEnabled: false,
  embeddedAudioRendered: false,
  associatedAudioRendered: false,
  spanishVisualRuntimeEstablished: false,
  rootCompositionEstablished: false,
  companionCompositionEstablished: false,
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
