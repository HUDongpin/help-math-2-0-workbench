/** Acceptance-neutral source-static facts for G4 L11 IN013. */

export const COURSE_G04_L11_IN_013_STATIC_ANIMATION_ID =
  "course-g04-l11-in-013" as const;

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

export const COURSE_G04_L11_IN_013_CHOICES = deepFreeze([
  {id: "three-units", label: "3 units", sourceButtonObjectId: 38,
    sourceInstanceName: "AnsBtn2", correct: false},
  {id: "four-units", label: "4 units", sourceButtonObjectId: 36,
    sourceInstanceName: "AnsBtn1", correct: true},
  {id: "five-units", label: "5 units", sourceButtonObjectId: 37,
    sourceInstanceName: "AnsBtn3", correct: false},
] as const);

export const COURSE_G04_L11_IN_013_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN13.swf",
    bytes: 200_094,
    sha256: "9565fafc4a24c57f2b122fe2cbba59bdab66f551e758c077929f0d01549e2c49",
    mode: "0500", nlink: 1,
  },
  pairedFla: {status: "missing"},
  externalSpanishAudio: {status: "missing"},
  scenarioInventory: {
    path: "migrations/course-g04-l11-in-013/audit/scenario-inventory.json",
    bytes: 368_770,
    sha256: "d6b8f545f07cac004b0a964b6b41d68dda2b9242313256b6580bf522aa22cf04",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-in-013/audit/frame-domain-disposition.json",
    bytes: 46_850,
    sha256: "254c8200aaf26f20b307fa879fe6a8eed7dffb90fddd679056eacb4a0871ea38",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-in-013/audit/audio-runtime-evidence.json",
    bytes: 21_134,
    sha256: "9b1b382ee92ab5137ab0a848d311e499a0abd4bd89a0017958fae7e4e9af248c",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-in-013/audit/machine/swf-frame-domain-candidates.json",
    bytes: 7_066,
    sha256: "703ad13878fe06d99d433aaeb4c97e2aed090e55394d4e43d308c05de77a0ab1",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-in-013/audit/machine/swfmill.xml.gz",
    bytes: 292_765,
    sha256: "bcdefe949d9a127a5d4c8c11422174eff60951bc3f0e9396d488f1c7a75630a0",
  },
} as const);

export const COURSE_G04_L11_IN_013_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_013_STATIC_ANIMATION_ID,
  assetId: "swf-9565fafc4a24c57f2b122fe2cbba59bdab66f551e758c077929f0d01549e2c49",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 25,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Length of Line Segment Practice",
      es: "Práctica para determinar la longitud de segmentos de línea"}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", stage: {width: 800, height: 600,
      backgroundColor: "#b8d8f7"}, fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-224",
    sourceObjectId: 224, frame: 6, depth: 3, instanceName: "animation",
    translationTwips: {x: 8_268, y: 5_666},
    translationPixels: {x: 413.4, y: 283.3}},
  instruction: {prompt: "Click the length of this line segment.",
    orientation: "horizontal",
    endpoints: [{x: 3, y: 5, orderedPair: "(3,5)"},
      {x: 7, y: 5, orderedPair: "(7,5)"}],
    sharedY: 5, subtraction: "7 − 3 = 4",
    choices: COURSE_G04_L11_IN_013_CHOICES,
    exactWrongFeedback:
      "Subtract the x-coordinates 7 minus 3 to find the length. Try again."},
  principalTimeline: {timelineId: "sprite-224", frameCount: 67,
    naturalQuizStopFrameFromScript: 49,
    sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    directSeekLimit: "Direct frame selection does not execute answer branches, feedback selection, host pause/resume, audio synchronization, or terminal behavior."},
  reachableNestedTimelineCount: 16,
  rightFeedbackFamilies: [
    {instance: "Mc_Right_Feed1", timelineId: "sprite-192", frameCount: 28},
    {instance: "Mc_Right_Feed2", timelineId: "sprite-142", frameCount: 31},
    {instance: "Mc_Right_Feed3", timelineId: "sprite-159", frameCount: 28},
    {instance: "Mc_Right_Feed4", timelineId: "sprite-180", frameCount: 33},
    {instance: "Mc_Right_Feed5", timelineId: "sprite-223", frameCount: 26},
  ],
  wrongFeedbackFamilies: [
    {instance: "Mc_Wrong_Feed1", timelineId: "sprite-93", frameCount: 28},
    {instance: "Mc_Wrong_Feed2", timelineId: "sprite-104", frameCount: 28},
    {instance: "Mc_Wrong_Feed3", timelineId: "sprite-116", frameCount: 31},
    {instance: "Mc_Wrong_Feed4", timelineId: "sprite-65", frameCount: 31},
  ],
  glossaryControls: [
    {buttonObjectId: 26, glossaryKey: "Length"},
    {buttonObjectId: 27, glossaryKey: "Line segment"},
  ],
  audio: {embeddedStreamCount: 11,
    principalStream: {timelineId: "sprite-224", blockCount: 63,
      structuralDurationMs: 5_224, format: "mp3", sampleRateHz: 22_050,
      channels: 1}, audibleContentAccepted: false,
    feedbackVariantAudioAccepted: false, synchronizationAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    answerChoiceControlsRequired: 3, animationInternalGlossaryControlsRequired: 2,
    modernReplayProvided: true, sourceFeedbackVariantSelectionEstablished: false},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
