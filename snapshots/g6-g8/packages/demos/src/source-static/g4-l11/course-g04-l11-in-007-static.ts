export const COURSE_G04_L11_IN_007_STATIC_ANIMATION_ID =
  "course-g04-l11-in-007" as const;

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

export const COURSE_G04_L11_IN_007_POINT = deepFreeze({label: "Z", x: 7, y: 5});
export const COURSE_G04_L11_IN_007_CHOICES = deepFreeze([
  {id: "five-seven", label: "(5,7)", x: 5, y: 7, correct: false,
    sourceButtonObjectId: 37},
  {id: "seven-five", label: "(7,5)", x: 7, y: 5, correct: true,
    sourceButtonObjectId: 36},
  {id: "seven-seven", label: "(7,7)", x: 7, y: 7, correct: false,
    sourceButtonObjectId: 37},
] as const);

export const COURSE_G04_L11_IN_007_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_007_STATIC_ANIMATION_ID,
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 19,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page"},
  source: {
    swf: {path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN07.swf",
      bytes: 818_129,
      sha256: "f18fc0017197980cd8e4398b4320b82ca924d38466299f61e8664c8c039de97a",
      mode: "0500", nlink: 1},
    fla: null,
    pairedFlaStatus: "missing",
    externalPageAudio: null,
  },
  evidence: {
    scenarioInventory: {bytes: 369_250,
      sha256: "50436a8980d9c3557dd563a783bb72a71fcabe045b6a782c8223a4b3b18c773e"},
    frameDomainDisposition: {bytes: 45_684,
      sha256: "8086bf9c212f819b430f1f66dffffbb7991593f088be3327e1c0fa53e18f3107"},
    audioEvidence: {bytes: 20_839,
      sha256: "7f35130b1be4e8d0f1281a2d207ef3d6fd60dfc5fa2f20f6ede334b0acdcb3cd"},
    frameCandidates: {bytes: 6_739,
      sha256: "d1c208797476b03e38926277c2d257f4515106c65b610284fbea696494f7d229"},
    generatedCanvasManifest: {bytes: 14_513,
      sha256: "219f5730ee2551727c2cd2541fe2e73a5a64927d2597ddc0b49f17b66f53408a"},
  },
  runtime: {stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
    principal: {timelineId: "sprite-232", frameCount: 137,
      naturalQuestionStopFrame: 66, terminalDefinitionFrame: 137,
      sourceDomainDisposition: "unresolved"},
    rootPlacement: {depth: 3, instanceName: "animation",
      translationTwips: {x: 8_268, y: 5_666},
      translationPixels: {x: 413.4, y: 283.3}}},
  instruction: "Click the ordered pair that names Point Z on this coordinate grid.",
  point: COURSE_G04_L11_IN_007_POINT,
  choices: COURSE_G04_L11_IN_007_CHOICES,
  wrongFeedback: "In an ordered pair, the first number tells how many units over " +
    "from zero on the x-axis and the second number tells how many units up. Try again.",
  principalGlossaryControls: [
    {buttonObjectId: 25, key: "Ordered pair"},
    {buttonObjectId: 26, key: "Point"},
    {buttonObjectId: 27, key: "Coordinate grid"},
  ],
  wrongFeedbackGlossaryTerms: ["Ordered pair", "Number", "Unit", "Zero", "X-axis"],
  audio: {embeddedStreamTimelineCount: 11, enabled: false, accepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalChoicesFeedbackRetryAndGlossaryRequired: true},
  authorityBoundary: {registeredCurrentJavascript: false,
    sourceDomainDeclared: false, originalRuntimeAccepted: false,
    audioAccepted: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false},
  acceptanceEffect: "none",
} as const);
