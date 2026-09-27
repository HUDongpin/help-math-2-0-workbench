export const COURSE_G04_L11_IN_005_STATIC_ANIMATION_ID =
  "course-g04-l11-in-005" as const;

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

export const COURSE_G04_L11_IN_005_POINTS = deepFreeze([
  {label: "A", x: 2, y: 3, sourceControl: "sprite-131-clip-action"},
  {label: "B", x: 5, y: 2, sourceControl: "button-135"},
  {label: "C", x: 8, y: 1, sourceControl: "button-136"},
  {label: "D", x: 10, y: 7, sourceControl: "button-133"},
  {label: "E", x: 5, y: 5, sourceControl: "button-134"},
  {label: "F", x: 1, y: 8, sourceControl: "button-132"},
] as const);

export const COURSE_G04_L11_IN_005_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_IN_005_STATIC_ANIMATION_ID,
  release: {releaseId: "lesson-g04-l11-coordinate-grid", ordinal: 17,
    releaseMemberCount: 44, activePageCount: 43,
    role: "active-xml-referenced-page"},
  source: {
    swf: {path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN05.swf",
      bytes: 271_250,
      sha256: "40dbbb3dabe3a762ee9da5c2a9e9d7a69bbb5c4f7647a28bbd6a94bc563ec25a",
      mode: "0444", nlink: 1},
    fla: {path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN05.fla",
      bytes: 3_038_208,
      sha256: "451818ef506b72bda7955f503ad436e7379d72409dcd0dc8da754c5871461f5a",
      mode: "0444", nlink: 1},
    externalSpanishAudio: {path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN05.mp3",
      bytes: 341_040,
      sha256: "42646a495c4c1bf7f64094dd5324ecfe23ab1ac590c4100ff25493dfb440b4a9",
      mode: "0444", nlink: 1, structuralDurationMs: 24_360},
  },
  evidence: {
    scenarioInventory: {bytes: 265_842,
      sha256: "3a76cdc79e79377d7ba673d81b6e1d3b501c3948baacff67ba614f1e91c887ff"},
    frameDomainDisposition: {bytes: 26_874,
      sha256: "4c44aef00331ffe5e39790836eb442677bad9c76b2281c0f82de11f2656dff64"},
    audioEvidence: {bytes: 15_746,
      sha256: "cccfdfc55e76585f3362879739c8b4172b28029611f59177ca4318b165e7a3cb"},
    frameCandidates: {bytes: 5_107,
      sha256: "ae8e106b1c2c0f98b65260c21094f62eff7af4fd887b31a6bcf5b80e09400a38"},
    generatedCanvasManifest: {bytes: 11_784,
      sha256: "f695b0dd7a7b046c97ffd30a204a8062abd3163a19dc153f7c181cb7cd7c6334"},
  },
  runtime: {stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
    principal: {timelineId: "sprite-137", frameCount: 661,
      naturalHoverStopFrame: 647, terminalDefinitionFrame: 661,
      sourceDomainDisposition: "unresolved"},
    rootPlacement: {depth: 3, instanceName: "animation",
      translationTwips: {x: 8_248, y: 5_666},
      translationPixels: {x: 412.4, y: 283.3}}},
  instruction:
    "Roll over the points on the coordinate grid to see their coordinates.",
  points: COURSE_G04_L11_IN_005_POINTS,
  glossaryControls: [
    {buttonObjectId: 67, key: "Point"},
    {buttonObjectId: 68, key: "Coordinate"},
    {buttonObjectId: 106, key: "Coordinate grid"},
  ],
  audio: {embeddedStreamTimeline: "sprite-137", blockCount: 660,
    structuralDurationMs: 54_962, enabled: false, accepted: false},
  productBoundary: {modernLessonShellUsed: true,
    legacyCourseShellNavigationAndPlayerChromeIncluded: false,
    animationInternalPointHoverAndGlossaryControlsRequired: true},
  authorityBoundary: {registeredCurrentJavascript: false,
    sourceDomainDeclared: false, originalRuntimeAccepted: false,
    audioAccepted: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, humanReviewAccepted: false,
    ownerAccepted: false, strictCompletion: false, lessonRelease: false,
    publication: false},
  acceptanceEffect: "none",
} as const);
