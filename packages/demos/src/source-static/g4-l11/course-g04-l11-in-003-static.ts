/**
 * Acceptance-neutral source-static facts for G4 L11 IN003.
 *
 * This module does not execute AVM1, play audio, register a renderer, or
 * establish natural reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_IN_003_STATIC_ANIMATION_ID =
  "course-g04-l11-in-003" as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): Readonly<T> => {
  if (value !== null && typeof value === "object") {
    const object = value as Record<PropertyKey, unknown>;
    if (!seen.has(object)) {
      seen.add(object);
      for (const key of Reflect.ownKeys(object)) deepFreeze(object[key], seen);
      Object.freeze(object);
    }
  }
  return value as Readonly<T>;
};

export const COURSE_G04_L11_IN_003_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN03.swf",
    bytes: 321_684,
    sha256:
      "4e7de4f04322e5460b468c3ea066f56345fc345bcd10fca40ed990eefc695885",
    mode: "0444",
    nlink: 1,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN03.fla",
    bytes: 1_838_592,
    sha256:
      "9a1a87174c0b71814ef521c48bc7e1de1dee83637d1a061d44a923db8b12ee1f",
    mode: "0444",
    nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-in-003/audit/scenario-inventory.json",
    bytes: 183_426,
    sha256:
      "25f493925462192fa739600e131f0cb68bfb492a3d15f38d09fa482e1de7f30e",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-003/audit/frame-domain-disposition.json",
    bytes: 11_874,
    sha256:
      "2db6c59edce70d8029854347282beab257e9da8f1772706fbda3a1e95735cc31",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-in-003/audit/audio-runtime-evidence.json",
    bytes: 15_768,
    sha256:
      "3dd9feac41f8d79818f2f3e22bab3a28f4923e2a8506549cd4924a03beb438c8",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-in-003/audit/machine/swf-frame-domain-candidates.json",
    bytes: 3_149,
    sha256:
      "705461d44da340f5c2d8d6bcc57e959f1ce1f04cfeae136b77f0edc5f01413aa",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-in-003/audit/machine/swfmill.xml.gz",
    bytes: 339_764,
    sha256:
      "8c5f7318304790750eca0574102c0f8c057bc0d8b8b7390abce260c6756dbb1f",
  },
} as const);

export const COURSE_G04_L11_IN_003_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_003_STATIC_ANIMATION_ID,
  assetId:
    "swf-4e7de4f04322e5460b468c3ea066f56345fc345bcd10fca40ed990eefc695885",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 15,
    releaseMemberCount: 44,
    activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Coordinate Grid", es: "Cuadrícula de coordenadas"},
  },
  runtimeHeader: {
    signature: "CWS",
    swfVersion: 6,
    actionScriptVersion: "AS1/2",
    stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    fps: 12,
    rootFrameCount: 10,
  },
  rootPlacement: {
    parentTimelineId: "root",
    childTimelineId: "sprite-109",
    sourceObjectId: 109,
    frame: 6,
    depth: 3,
    instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3},
  },
  instruction: {
    definition:
      "An ordered pair is a pair of numbers used to locate a point on a coordinate grid.",
    plottingOrder: "x-coordinate first; y-coordinate second",
    examples: [
      {x: 2, y: 7, orderedPair: "(2,7)"},
      {x: 3, y: 5, orderedPair: "(3,5)"},
    ],
    structuralObservations: [
      {frame: 1, observation: "isolated-principal-visually-empty"},
      {frame: 120, observation: "ordered-pair-definition-visible"},
      {frame: 240, observation: "first-prompt-and-x-coordinate-two-visible"},
      {frame: 400, observation: "first-y-path-and-next-ordered-pair-prompt-visible"},
      {frame: 520, observation: "first-point-two-seven-and-transition-prompt-visible"},
      {frame: 680, observation: "second-prompt-and-y-path-to-five-visible"},
      {frame: 781, observation: "second-point-three-five-labeled-at-local-stop"},
    ],
    supplementalTextResource: {
      exportedSymbolId: "sprite-44",
      exportName: "tabl",
      frameCount: 31,
      topic: "U.S. Hurricane Strikes by Decade",
      naturalReachabilityEstablished: false,
    },
  },
  principalTimeline: {
    timelineId: "sprite-109",
    frameCount: 781,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    localStopFrames: [781],
    localStopActionStructurallyPresent: true,
    sourceTerminalBehaviorEstablished: false,
    directSeekLimit:
      "Direct local-frame selection does not establish natural entry, narration synchronization, glossary return, terminal hold or loop behavior, or Replay.",
  },
  otherNestedDefinitions: [
    {timelineId: "sprite-2", objectId: 2, frameCount: 1,
      rootReachability: "excluded-not-proven"},
    {timelineId: "sprite-43", objectId: 43, frameCount: 1,
      rootReachability: "excluded-not-proven"},
    {timelineId: "sprite-44", objectId: 44, frameCount: 31,
      rootReachability: "excluded-not-proven"},
    {timelineId: "sprite-47", objectId: 47, frameCount: 1,
      rootReachability: "reachable-from-root-placement-graph",
      sourceDomainDisposition: "unresolved"},
  ],
  glossaryControls: [
    {buttonObjectId: 51, glossaryKey: "Locate"},
    {buttonObjectId: 52, glossaryKey: "Ordered pair"},
    {buttonObjectId: 53, glossaryKey: "Coordinate grid"},
    {buttonObjectId: 54, glossaryKey: "Pair"},
    {buttonObjectId: 55, glossaryKey: "Number"},
    {buttonObjectId: 56, glossaryKey: "Point"},
  ],
  sourceHostCalls: [
    "_root.DoHyperLinks",
    "_root.animation_mc.animation.stop",
  ],
  audio: {
    embeddedStreamCount: 1,
    principalStream: {
      timelineId: "sprite-109",
      firstBlockFrame: 1,
      lastBlockFrame: 781,
      blockCount: 781,
      structuralDurationMs: 65_045,
      format: "mp3",
      sampleRateHz: 22_050,
      channels: 1,
    },
    externalSpanish: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN03.mp3",
      bytes: 623_952,
      sha256:
        "12e98c342081696a2b14515cd517447a8bb48a059e6712f0251839ef403251c7",
      structuralDurationMs: 44_568,
      hostRouteLanguage: "es",
    },
    audibleContentAccepted: false,
    synchronizationAccepted: false,
  },
  productBoundary: {
    modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalGlossaryControlsRequired: true,
    modernLocalReplayProvided: true,
    sourceReplayBehaviorEstablished: false,
  },
  authorityBoundary: {
    sourceStaticOnly: true,
    rendererRegistered: false,
    currentJavascriptRegistered: false,
    sourceDomainDeclared: false,
    originalRuntimeAccepted: false,
    audioAccepted: false,
    bilingualParityEstablished: false,
    behaviorParityEstablished: false,
    visualFidelityEstablished: false,
    humanReviewAccepted: false,
    ownerAccepted: false,
    strictCompletion: false,
    lessonRelease: false,
    publication: false,
  },
  acceptanceEffect: "none",
} as const);
