/** Acceptance-neutral source-static facts for G4 L11 TI007. */

export const COURSE_G04_L11_TI_007_STATIC_ANIMATION_ID =
  "course-g04-l11-ti-007" as const;

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

export const COURSE_G04_L11_TI_007_CHOICES = deepFreeze([
  {id: "three-units", label: "3 units", sourceButtonObjectId: 100,
    sourceInstanceName: "AnsBtn2", correct: false},
  {id: "four-units", label: "4 units", sourceButtonObjectId: 100,
    sourceInstanceName: "AnsBtn1", correct: false},
  {id: "five-units", label: "5 units", sourceButtonObjectId: 99,
    sourceInstanceName: "AnsBtn3", correct: true},
] as const);

export const COURSE_G04_L11_TI_007_GLOSSARY = deepFreeze([
  {id: "number", label: "number", sourceButtonObjectId: 66,
    sourceKeyAttribute: "Number",
    prompt: "A number tells how many or how much."},
  {id: "unit", label: "unit", sourceButtonObjectId: 67,
    sourceKeyAttribute: "Unit",
    prompt: "A unit is the fixed amount used to measure length."},
  {id: "length", label: "length", sourceButtonObjectId: 68,
    sourceKeyAttribute: "Length",
    prompt: "Length tells the distance from one endpoint to the other."},
  {id: "line-segment", label: "line segment", sourceButtonObjectId: 69,
    sourceKeyAttribute: "Line segment",
    prompt: "A line segment is the part of a line between two endpoints."},
  {id: "horizontal", label: "horizontal", sourceButtonObjectId: 111,
    sourceKeyAttribute: "Horizontal",
    prompt: "A horizontal segment goes straight from left to right."},
  {id: "subtract", label: "subtract", sourceButtonObjectId: 256,
    sourceKeyAttribute: "Subtract",
    prompt: "Subtract to find the difference between two values."},
  {id: "x-coordinate", label: "x-coordinate", sourceButtonObjectId: 112,
    sourceKeyAttribute: "X-coordinate",
    prompt: "The x-coordinate tells a point's horizontal position."},
  {id: "coordinate-grid", label: "coordinate grid", sourceButtonObjectId: 114,
    sourceKeyAttribute: "Coordinate grid",
    prompt: "A coordinate grid locates points with x- and y-coordinates."},
] as const);

export const COURSE_G04_L11_TI_007_STATIC_EVIDENCE = deepFreeze({
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI07.swf",
    bytes: 153_525,
    sha256: "b358b553e11311b7b2576e293ec9a587dd618969d009ed1c5639eafe3feb6a0b",
    mode: "0500", nlink: 1,
  },
  pairedFla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI07.fla",
    bytes: 1_503_232,
    sha256: "857891e9c56d2f998cf5954ec243e226c3ccd283da3fdde65308d5d61cb2e568",
    mode: "0500", nlink: 1, status: "present-partially-inspected",
  },
  externalSpanishAudio: {path: null, bytes: 0, sha256: null,
    status: "absent-no-source-binding"},
  scenarioInventory: {
    path: "migrations/course-g04-l11-ti-007/audit/scenario-inventory.json",
    bytes: 488_820,
    sha256: "b082dfae901607e6076e5f0ec4cb6ff965ef931a07a9d48133e1fd98d5011408",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-ti-007/audit/frame-domain-disposition.json",
    bytes: 36_726,
    sha256: "bde0485012540b2df4ff07333eb2fd1d4598ca051cf98f70924f8e4f9864e506",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-ti-007/audit/audio-runtime-evidence.json",
    bytes: 16_344,
    sha256: "1787769bc41af43f98c67ac9d7f19ae744d80ee47e266d66f03167b6580a8471",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-ti-007/audit/machine/swf-frame-domain-candidates.json",
    bytes: 6_746,
    sha256: "68b1ae534cff9f6e898f17f9ac9a4dae8e3d77503d2ac228ae7140e2ade4f562",
  },
  swfmillStructure: {
    path: "migrations/course-g04-l11-ti-007/audit/machine/swfmill.xml.gz",
    bytes: 215_482,
    sha256: "e02ab379ecc01b1c5543db3bfefb5f3dde96262f17fa81f40dee5c7983c9f00e",
  },
} as const);

export const COURSE_G04_L11_TI_007_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_TI_007_STATIC_ANIMATION_ID,
  assetId: "swf-b358b553e11311b7b2576e293ec9a587dd618969d009ed1c5639eafe3feb6a0b",
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 31,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page",
    title: {en: "Question 6", es: null}},
  runtimeHeader: {signature: "CWS", swfVersion: 6,
    actionScriptVersion: "AS1/2", stage: {width: 800, height: 600,
      nativeWidth: 799.9, nativeHeight: 599.75, backgroundColor: "#b8d8f7"},
    fps: 12, rootFrameCount: 10},
  rootPlacement: {parentTimelineId: "root", childTimelineId: "sprite-258",
    sourceObjectId: 258, frame: 6, depth: 4, instanceName: "animation",
    translationTwips: {x: 8_248, y: 5_666},
    translationPixels: {x: 412.4, y: 283.3}},
  instruction: {
    prompt: "Click the number of units for the length of this line segment.",
    orientation: "horizontal",
    endpoints: [{x: 9, y: 1, orderedPair: "(9,1)"},
      {x: 4, y: 1, orderedPair: "(4,1)"}],
    sharedY: 1, subtraction: "9 − 4 = 5",
    choices: COURSE_G04_L11_TI_007_CHOICES,
    sourceWrongFeedback: "Read the second part of the rule. Try again.",
    visibleCoaching:
      "Subtract the x-coordinates 9 minus 4 to find the length. Try again.",
  },
  principalTimeline: {timelineId: "sprite-258", frameCount: 143,
    naturalQuizStopFrameFromScript: 119, postCorrectStartFrame: 120,
    terminalFrame: 143, sourceDomainDisposition: "unresolved",
    structuralReachability: "reachable-from-root-placement-graph",
    placementEntryState: "unresolved",
    directSeekLimit: "Direct frame selection does not execute answer branches, feedback selection, help, glossary, host pause/resume, audio synchronization, or terminal behavior."},
  reachableNestedTimelineCount: 12,
  rightFeedbackFamilies: [
    {instance: "Mc_Right_Feed4", timelineId: "sprite-153", frameCount: 25},
    {instance: "Mc_Right_Feed1", timelineId: "sprite-178", frameCount: 27},
    {instance: "Mc_Right_Feed3", timelineId: "sprite-218", frameCount: 27},
    {instance: "Mc_Right_Feed2", timelineId: "sprite-249", frameCount: 26},
  ],
  help: {sourceInstanceName: "NMHBtn", sourceObjectId: 55,
    popupTimelineId: "sprite-121", popupFrameCount: 1,
    coachTimelineId: "sprite-251", coachFrameCount: 55},
  glossary: COURSE_G04_L11_TI_007_GLOSSARY,
  audio: {embeddedStreamCount: 7, principalTimelineBlockCount: 120,
    principalStructuralDurationMs: 9_979, coachBlockCount: 53,
    coachStructuralDurationMs: 4_389, format: "mp3", sampleRateHz: 22_050,
    channels: 1, audibleContentAccepted: false,
    feedbackVariantAudioAccepted: false, synchronizationAccepted: false,
    externalSpanishAudioAccepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    legacyPreloaderIncluded: false, duplicateOldAndModernControlsIncluded: false,
    answerChoiceControlsRequired: 3, helpControlRequired: 1,
    animationInternalGlossaryControlsRequired: 8,
    animationInternalPedagogicalControlCount: 12,
    modernReplayProvided: true, sourceFeedbackVariantSelectionEstablished: false},
  authorityBoundary: {sourceStaticOnly: true, rendererRegistered: false,
    currentJavascriptRegistered: false, sourceDomainDeclared: false,
    originalRuntimeAccepted: false, audioAccepted: false,
    bilingualParityEstablished: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false}, acceptanceEffect: "none",
} as const);
