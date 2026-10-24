/**
 * Acceptance-neutral source-static facts for G4 L11 IN010.
 *
 * This module does not execute AVM1, play audio, register a renderer, or
 * establish natural reachability, fidelity, review, completion, or release.
 */

export const COURSE_G04_L11_IN_010_STATIC_ANIMATION_ID =
  "course-g04-l11-in-010" as const;

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

export const COURSE_G04_L11_IN_010_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN10.swf",
    bytes: 879_754,
    sha256:
      "8af2d73e85df5c68702ce37d2f233c64766434283d2fe6b419938e427c55a488",
    mode: "0444",
    nlink: 1,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN10.fla",
    bytes: 2_720_256,
    sha256:
      "b0269e6cb26d7dd89ca5a2705f4e11c0df093e88f0cfc0e2a1640d1521472815",
    mode: "0444",
    nlink: 1,
  },
  externalSpanishAudio: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN10.mp3",
    bytes: 456_288,
    sha256:
      "de8ed61168eeee4147e1bc857297414207e9bc9edb882a3b83275754912d9351",
    mode: "0444",
    nlink: 1,
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-in-010/audit/scenario-inventory.json",
    bytes: 381_233,
    sha256:
      "ff7246f0ab8d36cd1c26979ee61a342d0711a6e2e85b6e183dac1a37da66f0bc",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-010/audit/frame-domain-disposition.json",
    bytes: 45_466,
    sha256:
      "251b0460403040e36c327122933f4db16a079997b962c2320d1f62ac11853d4e",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-in-010/audit/audio-runtime-evidence.json",
    bytes: 26_699,
    sha256:
      "73510998ace9a3fc383a25f08285c6bcf66115386c90a3ced9070a594ad35e24",
  },
  frameDomainCandidates: {
    path:
      "migrations/course-g04-l11-in-010/audit/machine/swf-frame-domain-candidates.json",
    bytes: 6_742,
    sha256:
      "bb8c054c7f68f193039de67ad96fe5abfcc0af56a082bbae98c2633cdc8ff6d5",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-in-010/audit/machine/swfmill.xml.gz",
    bytes: 959_306,
    sha256:
      "64c248f7401d0546041d7608fd279e7427a513f38b0e5ad785c45d7118dd0b78",
  },
  generatedCanvasManifest: {
    path: "public/flash-assets/courses/course-g04-l11-in-010/manifest.json",
    bytes: 15_693,
    sha256:
      "37b26b27982773842a3d836d73384d792c67c189a21d7d978908de45641c8af5",
  },
} as const);

export const COURSE_G04_L11_IN_010_CHOICES = deepFreeze([
  {id: "left", label: "(2,3)", x: 2, y: 3, sourceInstance: "AnsBtn2", correct: false},
  {id: "middle", label: "(4,6)", x: 4, y: 6, sourceInstance: "AnsBtn3", correct: false},
  {id: "right", label: "(4,8)", x: 4, y: 8, sourceInstance: "AnsBtn1", correct: true},
] as const);

export const COURSE_G04_L11_IN_010_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_010_STATIC_ANIMATION_ID,
  assetId:
    "swf-8af2d73e85df5c68702ce37d2f233c64766434283d2fe6b419938e427c55a488",
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    ordinal: 22,
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
    childTimelineId: "sprite-246",
    sourceObjectId: 246,
    frame: 6,
    depth: 3,
    instanceName: "animation",
    translationTwips: {x: 8_268, y: 5_666},
    translationPixels: {x: 413.4, y: 283.3},
  },
  principalTimeline: {
    timelineId: "sprite-246",
    frameCount: 277,
    narratedBuildEndFrame: 190,
    naturalQuizStopFrame: 191,
    postCorrectStartFrame: 192,
    terminalDefinitionFrame: 277,
    sourceDomainDisposition: "declared-frame-domain",
    localActionFrameSequenceSha256:
      "6482ae52f10140265c025d05fb3d563c175206738a67f9c844abeea5917de660",
    localStopFrames: [191],
    staticFrame191ExecutedStateEstablished: false,
    executedQuizBackgroundFrame: 190,
  },
  freshFfdecExport: {
    tool: "JPEXS Free Flash Decompiler v.26.2.1",
    helper: {bytes: 52_872, sha256:
      "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93"},
    framesHtml: {bytes: 4_412_921, sha256:
      "8394b554e5eaed24399cd71d4f297ef9d0b11ad542ff0c4e9ef1eaa49cfcf1e9"},
    exportCanvas: {width: 1_181, height: 561},
    exportInternalTranslation: {x: 594.9, y: 341.35},
    stageRenderOffset: {x: -181.5, y: -58.05},
    placedFunctionCount: 211,
    placedFunctionsSha256:
      "e60e5e6365b0520121a6d74cd731bf43538455181f0e1c95f0d9b459a14cd67c",
    embeddedImageVariableCount: 15,
    embeddedImageVariablesSha256:
      "120f6f342a4f962226f0a33404df18904e753838081a784894db58710398b6f7",
    embeddedFontFunctionCount: 11,
    embeddedFontFunctionsSha256:
      "cac77788d664967940e87903bff887a177e1c68f7a970762efd328726d6819da",
    structuralFrameScan: {
      frameCount: 277,
      uniquePixelHashCount: 52,
      changedAdjacentPairCount: 92,
    },
  },
  question: {
    equation: "2x = y",
    knownPoints: [[2, 4], [3, 6], [5, 10]],
    prompt:
      "The line for the equation 2x = y includes the points two-four, three-six, and five-ten. Click the coordinates of the point that also belongs on the line for the equation 2x = y.",
    choices: COURSE_G04_L11_IN_010_CHOICES,
    correctChoiceId: "right",
    wrongMessage: "Which point belongs on the line? Try again.",
  },
  animationInternalPedagogicalControls: {
    answerChoiceCount: 3,
    glossaryCount: 4,
    wrongFeedbackCloseRequired: true,
    glossaryKeys: ["Equation", "Point", "Coordinate", "Line"],
    sourceControlCount: 8,
    controlsMustBeModernizedNotDeleted: true,
  },
  feedback: {
    wrongVariantCount: 4,
    correctVariantCount: 5,
    hostSelectionPolicyEstablished: false,
    correctFeedbackAutomaticResumeTimingEstablished: false,
  },
  nestedTimelines: {
    structuralDefinitionCount: 17,
    structurallyReachableCount: 15,
    declaredFrameDomainCount: 2,
    unresolvedDispositionCount: 14,
    excludedNotProvenCount: 1,
  },
  audio: {
    embeddedStreamCount: 11,
    externalSpanishStructuralDurationMs: 32_592,
    embeddedContentAccepted: false,
    externalSpanishContentAccepted: false,
    synchronizationAccepted: false,
  },
  productBoundary: {
    modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalAnswerControlsRequired: true,
    animationInternalGlossaryControlsRequired: true,
    animationInternalWrongFeedbackCloseRequired: true,
    modernLocalReplayProvided: true,
    sourceReplayBehaviorEstablished: false,
  },
  authorityBoundary: {
    sourceStaticOnly: true,
    rendererRegistered: false,
    currentJavascriptRegistered: false,
    sourceDomainDeclared: true,
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
