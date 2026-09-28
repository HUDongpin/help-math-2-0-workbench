import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_005_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN05.swf",
  swfSha256:
    "dcbc74e5f8391afb0a307421729c8b5d5f548f3185c429fb40e7aae3cb647048",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN05.fla",
  flaSha256:
    "91654d016163c79a3d49e1f7135280f90b276e9492877fa0b9a6d567acb6334e",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN05.mp3",
  associatedAudioSha256:
    "81ceef9a79907549339208d5c4f9f31f83bd774f71a41d4b3881c93957185bd2",
  embeddedAudioStreamSha256: Object.freeze([
    "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
    "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04",
    "21c2d262e42017abe23db99e74d1359f19b4576f6639f1c35db11a8e4b7870a9",
  ]),
  spriteObjectId: 80,
  staticallyUnreachableSpriteObjectId: 75,
  buttonObjectIds: Object.freeze([20, 21, 22, 76]),
  dragItemObjectIds: Object.freeze([57, 58, 59, 60, 61, 62, 63]),
  dragDropPlacementFrame: 144,
  interactionSignalCount: 18,
  timelineNavigationOccurrenceCount: 33,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

export const COURSE_G04_L03_IN_005_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-005",
  title: "Numbers on the Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-005/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-80",
  mainFrameCount: 186,
  livePlaybackEndFrame: 144,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-47", frameCount: 20, label: "Completion-feedback timeline"}),
    Object.freeze({id: "sprite-49", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-50", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-51", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-52", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-53", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-54", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-55", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-57", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-58", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-59", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-60", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-61", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-62", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-63", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-67", frameCount: 25, label: "Quiz-transition timeline"}),
    Object.freeze({id: "sprite-79", frameCount: 15, label: "Wrong-feedback timeline"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "numbers-on-number-line", firstFrame: 1, lastFrame: 186}),
    Object.freeze({id: "seven-item-drag-drop-static-drawing", firstFrame: 144, lastFrame: 186}),
  ]),
  sourceControlBehaviorLabel:
    "Four source buttons, seven draggable clips, thirty-three timeline-navigation occurrences, four embedded streams, the associated catalog-audio path, and all ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_005_AUTHORITY = Object.freeze({
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
