/**
 * Acceptance-neutral source-static facts for G4 L11 IN009.
 *
 * This module does not execute AVM1, play audio, register a renderer, or
 * establish natural reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_IN_009_STATIC_ANIMATION_ID =
  "course-g04-l11-in-009" as const;

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

export const COURSE_G04_L11_IN_009_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN09.swf",
    bytes: 249_768,
    sha256:
      "37ac27c9373b85c47842feba978057a17680140bdadb57d596a810628447c8c3",
    mode: "0500",
    nlink: 1,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN09.fla",
    bytes: 2_523_648,
    sha256:
      "85825ca22f04d0a06f128287c14b47453170cd33f5a2079226524394b450d08e",
    mode: "0500",
    nlink: 1,
  },
  externalSpanishAudio: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN09.mp3",
    bytes: 690_816,
    sha256:
      "3fa84024d869268451cfb1a28dea43ed6b18d9ea266666833de23f1ae061284e",
    mode: "0500",
    nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-in-009/audit/scenario-inventory.json",
    bytes: 529_467,
    sha256:
      "25079aa1b61ee70aa79a9b57d478478f11e559ff8f777e9d1514dbbc90b76bc0",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-009/audit/frame-domain-disposition.json",
    bytes: 59_300,
    sha256:
      "51936ce33e4e600f5e5d5b450e837ca3c7cc006728d073c524bc8f9730a22ac4",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-in-009/audit/audio-runtime-evidence.json",
    bytes: 24_464,
    sha256:
      "e97cdc3e371440891508776f60c85c17a674149f5a01b84d6869dc2ee9d394cb",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-in-009/audit/machine/swf-frame-domain-candidates.json",
    bytes: 9_682,
    sha256:
      "5efe75b855efa0a8939bf58812d7a4f009e7ff987976f4bbdfd5aaaaaac98fb9",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-in-009/audit/machine/swfmill.xml.gz",
    bytes: 299_291,
    sha256:
      "3cb32f40df7311efe610dccbc9409cc0bf919edf1321aed14165cf2917dba2e9",
  },
  generatedCanvasManifest: {
    path: "public/flash-assets/courses/course-g04-l11-in-009/manifest.json",
    bytes: 15_258,
    sha256:
      "82664d5ff40a37edfe461247acae53a5e0bc67311534923539f8c968b9b2a862",
  },
} as const);

export const COURSE_G04_L11_IN_009_ROWS = deepFreeze([
  {row: 1, x: 1, y: 3, inputName: "input1_txt", controlName: "plot1"},
  {row: 2, x: 2, y: 4, inputName: "input2_txt", controlName: "plot2"},
  {row: 3, x: 3, y: 5, inputName: "input3_txt", controlName: "plot3"},
  {row: 4, x: 4, y: 6, inputName: "input4_txt", controlName: "plot4"},
  {row: 5, x: 5, y: 7, inputName: "input5_txt", controlName: "plot5"},
] as const);

export const COURSE_G04_L11_IN_009_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_009_STATIC_ANIMATION_ID,
  assetId:
    "swf-37ac27c9373b85c47842feba978057a17680140bdadb57d596a810628447c8c3",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 21,
    releaseMemberCount: 44,
    activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Plot Points to Make a Line Practice", es: "Práctica para nombrar puntos"},
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
    childTimelineId: "sprite-288",
    sourceObjectId: 288,
    frame: 6,
    depth: 3,
    instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3},
  },
  principalTimeline: {
    timelineId: "sprite-288",
    frameCount: 421,
    narratedBuildEndFrame: 406,
    naturalQuizStopFrame: 407,
    terminalDefinitionFrame: 421,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    localStopFrames: [407, 421],
    staticFrame407ExecutedStateEstablished: false,
    executedQuizBackgroundFrame: 406,
  },
  freshFfdecExport: {
    tool: "JPEXS Free Flash Decompiler v.26.2.1",
    helper: {bytes: 52_872, sha256:
      "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93"},
    framesHtml: {bytes: 3_276_612, sha256:
      "74d3bfc93c7851107d571f7b851c9f243430c74b2f2455626f444f54b94ad07d"},
    exportCanvas: {width: 1_779, height: 1_075},
    exportInternalTranslation: {x: 1_047.75, y: 874.65},
    stageRenderOffset: {x: -635.35, y: -591.35},
    placedFunctionCount: 217,
    placedFunctionsSha256:
      "d8440fd24f23f31bca333b0b8b871a4cbcbf6a136125e0a2e59c509c600f76b9",
    embeddedImageVariableCount: 0,
    embeddedFontFunctionCount: 8,
    structuralFrameScan: {
      frameCount: 421,
      uniquePixelHashCount: 82,
      changedAdjacentPairCount: 91,
      contactSheetSha256:
        "a09e05605a56d15566ab8e5bab53c2787025c3369d6b82f90a1e1485a1204d80",
    },
  },
  practice: {
    instruction:
      "Click the text box in the y column, type the correct value for y, and then click Plot Point for each point. When you have plotted all of the points, click Draw Line to connect the points that you plotted.",
    equation: "x + 2 = y",
    rowCount: 5,
    correctPairs: COURSE_G04_L11_IN_009_ROWS,
    drawLineRevealedAtCount: 5,
    firstWrongMessage: "Oops! Try again.",
    secondWrongMessages: COURSE_G04_L11_IN_009_ROWS.map(
      ({x, y}) => `When x = ${x}, y = ${y}`,
    ),
    as2NumberConversionRequired: true,
  },
  animationInternalPedagogicalControls: {
    plotPointCount: 5,
    drawLineCount: 1,
    glossaryCount: 4,
    popupCloseRequired: true,
    glossaryKeys: ["Column", "Plot", "Line", "Point"],
    controlsMustBeModernizedNotDeleted: true,
  },
  deterministicCoach: {
    timelineId: "sprite-273",
    frameCount: 55,
    labels: ["S1", "S2", "S3", "S4"],
    sourceSelection: "AS2 random(4)",
    evidenceCaptureSelection: "seed-derived-uniform-index",
  },
  nestedTimelines: {
    structuralDefinitionCount: 25,
    structurallyReachableCount: 21,
    unresolvedDispositionCount: 21,
    excludedNotProvenCount: 4,
    highRiskIndependentCandidates: [
      {timelineId: "sprite-288", frameCount: 421, role: "principal-practice"},
      {timelineId: "sprite-273", frameCount: 55, role: "random-coach-audio"},
    ],
  },
  audio: {
    embeddedStreamCount: 9,
    embeddedStreamTimelines: [
      "sprite-12", "sprite-186", "sprite-211", "sprite-228", "sprite-240",
      "sprite-271", "sprite-273", "sprite-287", "sprite-288",
    ],
    externalSpanishStructuralDurationMs: 49_344,
    embeddedContentAccepted: false,
    externalSpanishContentAccepted: false,
    synchronizationAccepted: false,
  },
  productBoundary: {
    modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalPlotPointControlsRequired: true,
    animationInternalDrawLineControlRequired: true,
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
