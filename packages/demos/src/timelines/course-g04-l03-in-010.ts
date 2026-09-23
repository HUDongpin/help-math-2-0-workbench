import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_010_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN10.swf",
  swfSha256:
    "fab625d5c4028a72a3d5672c65884cc2b83ab4df6a318e26057f70469e9a8011",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN10.fla",
  flaSha256:
    "ac91921e09cca9bde604e6a057e39f518c83a401cace66b919fcdbd7b0f4f6ea",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN10.mp3",
  associatedAudioSha256:
    "4372a57fee69a7bbeb4e96fed83db8dc6665f3fc229c42215b57abf11e0f1a84",
  embeddedAudioStreamSha256: Object.freeze([
    "b2c63dbaf7304c2c1042dda5e0ee305284f5136c275d6bc8e3e1fcdb552c99a5",
    "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04",
    "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
    "d20018a0addcf4a0b2802f3de47af8498c707ff6448f365a7d70479d2eae42fd",
  ]),
  spriteObjectId: 90,
  staticallyUnreachableSpriteObjectId: 83,
  buttonObjectIds: Object.freeze([39, 40, 84]),
  dragItemObjectIds: Object.freeze([70, 71, 72, 73, 74, 75]),
  dragDropPlacementFrame: 264,
  interactionSignalCount: 15,
  timelineNavigationOccurrenceCount: 27,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

export const COURSE_G04_L03_IN_010_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-010",
  title:
    "Situations with Negative Numbers: Temperature — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_010_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-010/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-90",
  mainFrameCount: 264,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-47", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-52", frameCount: 25, label: "Quiz-transition timeline"}),
    Object.freeze({id: "sprite-55", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-58", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-61", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-63", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-66", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-69", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-70", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-71", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-72", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-73", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-74", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-75", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-87", frameCount: 15, label: "Wrong-feedback timeline"}),
    Object.freeze({id: "sprite-89", frameCount: 20, label: "Completion-feedback timeline"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-number-temperature", firstFrame: 1, lastFrame: 264}),
    Object.freeze({id: "six-item-drag-drop-static-drawing", firstFrame: 264, lastFrame: 264}),
  ]),
  sourceControlBehaviorLabel:
    "Three source buttons, six draggable clips, twenty-seven timeline-navigation occurrences, five embedded streams, the associated catalog-audio path, and all ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_010_AUTHORITY = Object.freeze({
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
