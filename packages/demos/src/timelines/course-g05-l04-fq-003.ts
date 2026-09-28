import type {G5L4Fq23QuestionAtlasConfig} from "../g5-l4-fq23-question-atlas-candidate";

export const COURSE_G05_L04_FQ_003_SOURCE = Object.freeze({
  swf:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ03.swf",
  swfBytes: 46_237,
  swfSha256:
    "7fd9965eb409dffb0756e4e60f6a06a5c2685015eebe25cef9e6d110a252cdab",
  fla:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ03.fla",
  flaBytes: 1_974_784,
  flaSha256:
    "6b205408ce8244a063df52add91eb9f3c8cbd05115d59eecbca7b853e33baa6b",
});

export const COURSE_G05_L04_FQ_003_ACCEPTANCE_EFFECTS = Object.freeze({
  implementationAuthorized: false,
  authoritativeOriginalRuntime: false,
  naturalRuntimeReachabilityComplete: false,
  frameDomainDispositionComplete: false,
  randomSelectionParityComplete: false,
  answerBehaviorComplete: false,
  scoringComplete: false,
  reviewComplete: false,
  bilingualVisualParityComplete: false,
  audioAccepted: false,
  timingComplete: false,
  reportingComplete: false,
  replayParityComplete: false,
  fullFrameRmseComplete: false,
  productQaComplete: false,
  accessibilityQaComplete: false,
  engineeringReviewAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  published: false,
} as const);

export const COURSE_G05_L04_FQ_003_CONFIG = Object.freeze({
  animationId: "course-g05-l04-fq-003",
  title: "Number Lines Final Quiz 3 — source-static question atlas inspection",
  source: COURSE_G05_L04_FQ_003_SOURCE,
  asset: Object.freeze({
    source:
      "/flash-assets/courses/course-g05-l04-fq-003/canvas-renderer.js",
    sha256:
      "6ec31edd28e18b384cc6bd207da94d6480857d5e6e01dc5637c6cb2726a67de8",
  }),
  sourceSelection: Object.freeze({
    kind: "sequential",
    sourceQuestionCount: 18,
    sourcePresentedQuestionCount: 18,
    sourceExpression:
      "_global.quizLabelArray[_global.totQuizCount - 1]",
    executedByCandidate: false,
  }),
  currentJavascriptBehavior: Object.freeze({
    questionSequenceEnabled: true,
    answerSubmissionEnabled: true,
    scoringEnabled: true,
    textReviewEnabled: true,
    replayResetEnabled: true,
    executesLegacyActionScript: false,
    exactAvm1RandomOrderEstablished: false,
    sourceReviewVisualParityEstablished: false,
    reportingNetworkEnabled: false,
  }),
  acceptanceEffects: COURSE_G05_L04_FQ_003_ACCEPTANCE_EFFECTS,
} satisfies G5L4Fq23QuestionAtlasConfig);
