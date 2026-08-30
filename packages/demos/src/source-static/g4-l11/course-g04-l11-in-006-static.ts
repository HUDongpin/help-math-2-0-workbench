export const COURSE_G04_L11_IN_006_STATIC_ANIMATION_ID =
  "course-g04-l11-in-006" as const;

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

export const COURSE_G04_L11_IN_006_POINTS = deepFreeze([
  {label: "A", x: 6, y: 8, sourceControl: "sprite-99-clip-action",
    sourceFields: ["a1", "a2"]},
  {label: "B", x: 4, y: 2, sourceControl: "sprite-105-clip-action",
    sourceFields: ["b1", "b2"]},
  {label: "C", x: 1, y: 4, sourceControl: "sprite-96-clip-action",
    sourceFields: ["c1", "c2"]},
  {label: "D", x: 9, y: 5, sourceControl: "sprite-102-clip-action",
    sourceFields: ["d1", "d2"]},
] as const);

export const COURSE_G04_L11_IN_006_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_006_STATIC_ANIMATION_ID,
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 18,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page"},
  source: {
    swf: {path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN06.swf",
      bytes: 161_022,
      sha256: "2cc6448c72aa766a969def0c6fb1363e59120bbeff8599c955ecc824e4a4010f",
      mode: "0444", nlink: 1},
    fla: {path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN06.fla",
      bytes: 827_904,
      sha256: "ecc3ec6bb04f459ccd417604101208baf032459c148246c4738f6ce5a4b13855",
      mode: "0444", nlink: 1},
    externalSpanishAudio: {path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN06.mp3",
      bytes: 504_672,
      sha256: "65922d5288f1de08f4c4b21434fd470e02f3ffe8b5ce6c5c27dac34233d3dad8",
      mode: "0444", nlink: 1, structuralDurationMs: 36_048},
  },
  evidence: {
    scenarioInventory: {bytes: 549_343,
      sha256: "1b3f92a0965326a0e01199732a4ede6c15a31c733a527c15489e9349f759a5d7"},
    frameDomainDisposition: {bytes: 37_347,
      sha256: "eadffa2fcd8e7f4b9832d51ae78c12eefecb9f3eb9b630924f89c7fb0ead530a"},
    audioEvidence: {bytes: 21_334,
      sha256: "523506063f7b813af6aebeaf078ef04718286b10b6d05ca6c71751ea9a6144c4"},
    frameCandidates: {bytes: 5_766,
      sha256: "da6ad3bfbd8298d3d610814bd6810ebc422e919a86d3724dec73710208334908"},
    generatedCanvasManifest: {bytes: 12_532,
      sha256: "28dfb6424be22f18599c3aa6f551388908ee350a3d157e6f69d529e821bd9cdc"},
  },
  runtime: {stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
    principal: {timelineId: "sprite-137", frameCount: 287,
      naturalPracticeStopFrame: 275, terminalDefinitionFrame: 287,
      sourceDomainDisposition: "unresolved"},
    rootPlacement: {depth: 3, instanceName: "animation",
      translationTwips: {x: 8_268, y: 5_666},
      translationPixels: {x: 413.4, y: 283.3}}},
  instruction: "Click a point on the coordinate grid, then click the text boxes, " +
    "type the ordered pair, and click the Done button. When you get the correct " +
    "answer, click the Clear button to try another point.",
  points: COURSE_G04_L11_IN_006_POINTS,
  glossaryControls: [
    {buttonObjectId: 8, key: "Point"},
    {buttonObjectId: 9, key: "Coordinate grid"},
    {buttonObjectId: 10, key: "Ordered pair"},
    {buttonObjectId: 60, key: "Number"},
    {buttonObjectId: 61, key: "X-coordinate"},
    {buttonObjectId: 79, key: "Y-coordinate"},
  ],
  remediation: {firstWrong: "try-again-feedback-and-controls-disabled",
    secondWrong: "exact-source-pair-filled-and-point-selection-reset",
    correct: "correct-feedback-and-controls-reenabled"},
  audio: {embeddedStreamTimelineCount: 6, principalBlockCount: 287,
    principalStructuralDurationMs: 23_902, enabled: false, accepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalPointSelectionInputsDoneClearFeedbackAndGlossaryRequired: true},
  authorityBoundary: {registeredCurrentJavascript: false,
    sourceDomainDeclared: false, originalRuntimeAccepted: false,
    audioAccepted: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false},
  acceptanceEffect: "none",
} as const);
